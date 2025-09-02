import * as ort from 'onnxruntime-web';

let session = null;

export async function initEngine() {
  if (!session) {
    try {
      // --- 關鍵修改：明確告訴 ONNX Runtime Wasm 檔案在哪裡 ---
      // 這個路徑是相對於網站根目錄的公開路徑
      ort.env.wasm.wasmPaths = '/'; 
      // 或者更明確地寫：
      // ort.env.wasm.wasmPaths = {
      //   'ort-wasm.wasm': '/ort-wasm.wasm',
      //   'ort-wasm-simd.wasm': '/ort-wasm-simd.wasm',
      //   'ort-wasm-threaded.wasm': '/ort-wasm-threaded.wasm'
      // };
      // -----------------------------------------------------

      const modelURL = '/ml2048.onnx';
      console.log('Creating ONNX session...');
      session = await ort.InferenceSession.create(modelURL, {
          // 建議加上 executionProviders，可以獲得更好的性能和相容性
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
      });
      console.log('ONNX session created successfully.');
    } catch (e) {
      console.error("Error creating ONNX session:", e);
      throw e;
    }
  }
}

export async function evaluatePosition(board) {
  if (!session) await initEngine();
  
  // Convert board to flat array
  const state = board.flat().map(value => (value === 0 ? 0 : Math.round(Math.log2(value))));
  
  // Create input tensor
  const input = new ort.Tensor('int64', state, [1, 16]);
  
  // Run inference
  const output = await session.run({
    'states': input
  });
  
  // Extract results
  const logits = Array.from(output.logits.data);
  const value = output.value.data[0];
  
  return {
    logits,
    value
  };
}
