document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const boardContainer = document.getElementById('game-board');
    const scoreSpan = document.getElementById('score');
    const statusMessage = document.getElementById('status-message');
    const autoMoveBtn = document.getElementById('auto-move-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const restartBtnOverlay = document.getElementById('restart-btn-overlay');
    const qValuesDisplay = document.getElementById('q-values-display');
    const TILE_COLOR_MAP = { 2: "tile-2", 4: "tile-4", 8: "tile-8", 16: "tile-16", 32: "tile-32", 64: "tile-64", 128: "tile-128", 256: "tile-256", 512: "tile-512", 1024: "tile-1024", 2048: "tile-2048" };

    // --- 遊戲狀態 ---
    let board = [];
    let score = 0;
    let ortSession = null;
    let bestMoveIndex = -1;

    // --- ONNX 模型相關 ---
    async function initONNX() {
        try {
            ortSession = await ort.InferenceSession.create('./your_model.onnx');
            statusMessage.textContent = '模型載入成功！請用方向鍵遊玩。';
            autoMoveBtn.disabled = false;
            initGame(); // 模型載入後才初始化遊戲
        } catch (error) {
            console.error(`載入模型失敗: ${error}`);
            statusMessage.textContent = `模型載入失敗: ${error}.`;
        }
    }

    function preprocessBoard(currentBoard) {
        const flatSize = 1 * 4 * 4 * 16;
        const powerMat = new Float32Array(flatSize).fill(0);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = currentBoard[i][j];
                const power = value === 0 ? 0 : Math.log2(value);
                const index = (i * 4 * 16) + (j * 16) + power;
                if (index < flatSize) powerMat[index] = 1.0;
            }
        }
        return powerMat;
    }

    async function runPrediction() {
        if (!ortSession || isGameOver()) return;
    
        const processedData = preprocessBoard(board);
        const inputTensor = new ort.Tensor('float32', processedData, [1, 4, 4, 16]);
        const feeds = { [ortSession.inputNames[0]]: inputTensor };
        const results = await ortSession.run(feeds);
        const qValues = results[ortSession.outputNames[0]].data;
        
        updateQValuesUI(qValues);
    }
    
    function updateQValuesUI(qValues) {
        const moveMap = ['向上 (Up)', '向左 (Left)', '向右 (Right)', '向下 (Down)'];
        bestMoveIndex = qValues.indexOf(Math.max(...qValues));
        
        qValuesDisplay.innerHTML = '';
        qValues.forEach((value, index) => {
            const item = document.createElement('div');
            item.className = 'q-value-item';
            if (index === bestMoveIndex) {
                item.classList.add('best-q-value');
            }
            item.innerHTML = `${moveMap[index]}: <span>${value.toFixed(4)}</span>`;
            qValuesDisplay.appendChild(item);
        });
    }


    // --- 2048 遊戲邏輯 ---
    function initGame() {
        board = Array(4).fill(0).map(() => Array(4).fill(0));
        score = 0;
        gameOverOverlay.classList.add('hidden');
        addRandomTile();
        addRandomTile();
        renderBoard();
        updateScore();
        runPrediction();
    }

    function renderBoard() {
        boardContainer.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const value = board[r][c];
                if (value > 0) {
                    cell.textContent = value;
                    cell.classList.add(TILE_COLOR_MAP[value] || 'tile-default');
                }
                boardContainer.appendChild(cell);
            }
        }
    }

    function addRandomTile() {
        let emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    function updateScore() {
        scoreSpan.textContent = score;
    }

    function move(direction) {
        let originalBoard = JSON.stringify(board);
        let tempBoard = JSON.parse(originalBoard);

        if (direction === 'up' || direction === 'down') {
            tempBoard = transpose(tempBoard);
        }

        for (let r = 0; r < 4; r++) {
            let row = tempBoard[r];
            if (direction === 'right' || direction === 'down') row.reverse();
            
            let newRow = row.filter(val => val !== 0); // Slide
            for (let i = 0; i < newRow.length - 1; i++) { // Merge
                if (newRow[i] === newRow[i + 1]) {
                    newRow[i] *= 2;
                    score += newRow[i];
                    newRow.splice(i + 1, 1);
                }
            }
            while (newRow.length < 4) newRow.push(0); // Pad with zeros
            
            if (direction === 'right' || direction === 'down') newRow.reverse();
            tempBoard[r] = newRow;
        }

        if (direction === 'up' || direction === 'down') {
            board = transpose(tempBoard);
        } else {
            board = tempBoard;
        }

        // 只有在盤面改變時才新增方塊和重新預測
        if (JSON.stringify(board) !== originalBoard) {
            addRandomTile();
            renderBoard();
            updateScore();
            runPrediction();
            if (isGameOver()) {
                gameOverOverlay.classList.remove('hidden');
            }
        }
    }

    function transpose(matrix) {
        return matrix[0].map((col, i) => matrix.map(row => row[i]));
    }

    function canMove() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (board[r][c] === 0) return true;
                if (r < 3 && board[r][c] === board[r + 1][c]) return true;
                if (c < 3 && board[r][c] === board[r][c + 1]) return true;
            }
        }
        return false;
    }

    function isGameOver() {
        return !canMove();
    }
    
    // --- 事件監聽 ---
    document.addEventListener('keydown', (e) => {
        if (gameOverOverlay.classList.contains('hidden')) {
            if (e.key === 'ArrowUp') move('up');
            else if (e.key === 'ArrowDown') move('down');
            else if (e.key === 'ArrowLeft') move('left');
            else if (e.key === 'ArrowRight') move('right');
        }
    });

    autoMoveBtn.addEventListener('click', () => {
        if (bestMoveIndex !== -1 && !isGameOver()) {
            const moveMap = { 0: 'up', 1: 'left', 2: 'right', 3: 'down' };
            move(moveMap[bestMoveIndex]);
        }
    });
    
    newGameBtn.addEventListener('click', initGame);
    restartBtnOverlay.addEventListener('click', initGame);

    // --- 啟動 ---
    initONNX();
});