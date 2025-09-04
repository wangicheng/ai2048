import * as ort from 'onnxruntime-web';

// 構造指向根目錄的 URL，外掛程式會確保這些檔案在根目錄存在
const base = import.meta.env.BASE_URL;

// 保持這個設定不變，因為外掛程式會將 worker 腳本複製到正確位置
ort.env.wasm.workerPath = `${base}ort-wasm-simd-threaded.mjs`;

// 這個設定也保持不變
ort.env.wasm.wasmPaths = {
  'ort-wasm-simd-threaded.wasm': `${base}ort-wasm-simd-threaded.wasm`,
  'ort-wasm-simd-threaded.mjs': `${base}ort-wasm-simd-threaded.mjs`,
  'ort-wasm-simd-threaded.jsep.wasm': `${base}ort-wasm-simd-threaded.jsep.wasm`,
  'ort-wasm-simd-threaded.jsep.mjs': `${base}ort-wasm-simd-threaded.jsep.mjs`,
};


let session = null;

export async function initEngine() {
  if (session) return;

  try {
    const modelURL = `${base}ml2048.onnx`; // 您的模型檔仍需放在 public 資料夾

    console.log('Creating ONNX session...');
    session = await ort.InferenceSession.create(modelURL, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
    });
    console.log('ONNX session created successfully.');

  } catch (e) {
    console.error("Error creating ONNX session:", e);
    throw e;
  }
}

// ... evaluatePosition 函數保持不變 ...
export async function evaluatePosition(board) {
  if (!session) {
    await initEngine();
  }
  
  const state = board.flat().map(value => (value === 0 ? 0 : Math.round(Math.log2(value))));
  const input = new ort.Tensor('int64', state, [1, 16]);
  const output = await session.run({ 'states': input });
  
  const logits = Array.from(output.logits.data);
  const value = output.value.data[0];
  
  return { logits, value };
}