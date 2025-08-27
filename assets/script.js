document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const boardContainer = document.getElementById('game-board');
    const predictBtn = document.getElementById('predict-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultContainer = document.getElementById('result-container');
    const bestMoveSpan = document.getElementById('best-move');
    const qValuesDiv = document.getElementById('q-values');
    const statusMessage = document.getElementById('status-message');
    const TILE_CLASSES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

    let ortSession = null;

    // --- Python 的 change_values 函數的 JavaScript 版本 ---
    function changeValuesJS(board) {
        // 模型期望的 shape: [1, 4, 4, 16]
        // 我們先創建一個展平的一維 Float32Array
        const flatSize = 1 * 4 * 4 * 16;
        const powerMat = new Float32Array(flatSize); // 預設全部為 0

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = board[i][j];
                let power = 0;
                if (value !== 0) {
                    power = Math.log2(value);
                }
                
                // 計算在展平陣列中的索引位置
                const index = (i * 4 * 16) + (j * 16) + power;
                powerMat[index] = 1.0;
            }
        }
        return powerMat;
    }
    
    // --- 主要的初始化函數 ---
    async function main() {
        try {
            // 創建 ONNX Runtime 推論會話
            // './2048_dqn_model.onnx' 是相對於 index.html 的路徑
            ortSession = await ort.InferenceSession.create('./2048_dqn_model.onnx');
            statusMessage.textContent = '模型載入成功！可以開始預測了。';
            predictBtn.disabled = false;
            predictBtn.textContent = '🚀 預測最佳走法';
        } catch (error) {
            console.error(`載入模型失敗: ${error}`);
            statusMessage.textContent = `模型載入失敗: ${error}. 請檢查主控台。`;
            predictBtn.textContent = '❌ 模型錯誤';
        }
    }
    
    // --- UI 相關函數 (與之前版本相同) ---
    function createBoard() { /* ... 與之前版本完全相同 ... */ }
    function updateCellStyle(inputElement) { /* ... 與之前版本完全相同 ... */ }
    function getBoardState() { /* ... 與之前版本完全相同 ... */ }
    
    // 將之前版本的 UI 函數複製過來
    function createBoard() {
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'cell-input';
            input.dataset.row = Math.floor(i / 4);
            input.dataset.col = i % 4;
            input.placeholder = "0";
            input.addEventListener('input', (e) => updateCellStyle(e.target));
            cell.appendChild(input);
            boardContainer.appendChild(cell);
        }
    }
    function updateCellStyle(inputElement) {
        const value = parseInt(inputElement.value, 10);
        inputElement.className = 'cell-input'; // Reset
        if (TILE_CLASSES.includes(value)) {
            inputElement.classList.add(`tile-${value}`);
        } else if (value > 2048) {
            inputElement.classList.add('tile-default');
        }
    }
    function getBoardState() {
        const board = Array(4).fill(0).map(() => Array(4).fill(0));
        const inputs = document.querySelectorAll('.cell-input');
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            const value = parseInt(input.value, 10) || 0;
            board[row][col] = value;
        });
        return board;
    }

    // --- 事件監聽器 ---
    clearBtn.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.cell-input');
        inputs.forEach(input => {
            input.value = '';
            updateCellStyle(input);
        });
        resultContainer.classList.add('hidden');
    });

    predictBtn.addEventListener('click', async () => {
        if (!ortSession) {
            alert('模型尚未載入完成，請稍候。');
            return;
        }

        predictBtn.textContent = '預測中...';
        predictBtn.disabled = true;

        try {
            // 1. 獲取並預處理棋盤數據
            const boardState = getBoardState();
            const processedData = changeValuesJS(boardState);
            
            // 2. 創建模型的輸入張量 (Tensor)
            const inputTensor = new ort.Tensor('float32', processedData, [1, 4, 4, 16]);
            
            // 3. 準備輸入
            const inputName = ortSession.inputNames[0];
            const feeds = { [inputName]: inputTensor };

            // 4. 執行模型推論
            const results = await ortSession.run(feeds);
            
            // 5. 處理輸出結果
            const outputName = ortSession.outputNames[0];
            const qValues = results[outputName].data; // 這是一個 Float32Array

            const bestMoveIndex = qValues.indexOf(Math.max(...qValues));
            const moveMap = {0: '向上 (Up)', 1: '向左 (Left)', 2: '向右 (Right)', 3: '向下 (Down)'};
            const bestMoveStr = moveMap[bestMoveIndex];

            // 6. 顯示結果到 UI
            bestMoveSpan.textContent = bestMoveStr;
            qValuesDiv.innerHTML = `
                Q-Values:<br>
                Up:    ${qValues[0].toFixed(4)}<br>
                Left:  ${qValues[1].toFixed(4)}<br>
                Right: ${qValues[2].toFixed(4)}<br>
                Down:  ${qValues[3].toFixed(4)}
            `;
            resultContainer.classList.remove('hidden');

        } catch (error) {
            alert('預測時發生錯誤: ' + error);
            console.error(error);
        } finally {
            predictBtn.textContent = '🚀 預測最佳走法';
            predictBtn.disabled = false;
        }
    });

    // --- 啟動應用 ---
    createBoard();
    main();
});