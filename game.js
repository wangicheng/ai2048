class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('best2048') || 0;
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.session = null;
        this.isAutoPlaying = false;
        this.autoPlayInterval = null;
        this.speed = 500;
        
        this.initializeBoard();
        this.initializeUI();
        this.loadModel();
        this.bindEvents();
        this.updateDisplay();
        this.updateBestScore();
    }

    initializeBoard() {
        this.board = Array(4).fill().map(() => Array(4).fill(0));
        this.addRandomTile();
        this.addRandomTile();
    }

    initializeUI() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            this.gameBoard.appendChild(tile);
        }
    }

    async loadModel() {
        try {
            console.log('Loading ONNX model...');
            // 使用 ONNX Runtime Web
            this.session = await ort.InferenceSession.create('2048_dqn_model.onnx', {
                executionProviders: ['webgl', 'wasm'],
                graphOptimizationLevel: 'all'
            });
            console.log('Model loaded successfully!');
            
            // 打印模型信息以幫助調試
            console.log('Input names:', this.session.inputNames);
            console.log('Output names:', this.session.outputNames);
            
            // 隱藏載入訊息並顯示 Q-Values
            document.getElementById('model-status').style.display = 'none';
            document.getElementById('q-values-grid').style.display = 'grid';
            
            this.predictQValues(); // 初始預測
        } catch (error) {
            console.error('Error loading model:', error);
            this.showModelError();
        }
    }

    showModelError() {
        const modelStatus = document.getElementById('model-status');
        modelStatus.textContent = 'Error loading AI model. Please check if 2048_dqn_model.onnx exists.';
        modelStatus.style.color = '#f67c5f';
        
        const qValueElements = ['up', 'left', 'right', 'down'];
        qValueElements.forEach(dir => {
            const element = document.getElementById(`q-value-${dir}`);
            if (element) {
                element.textContent = 'N/A';
            }
        });
    }

    bindEvents() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (this.isAutoPlaying) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });

        // 按鈕事件
        document.getElementById('new-game').addEventListener('click', () => {
            this.stopAutoPlay();
            this.newGame();
        });

        document.getElementById('ai-step').addEventListener('click', () => {
            if (!this.isAutoPlaying) {
                this.aiStep();
            }
        });

        const autoPlayBtn = document.getElementById('auto-play');
        autoPlayBtn.addEventListener('click', () => {
            if (this.isAutoPlaying) {
                this.stopAutoPlay();
            } else {
                this.startAutoPlay();
            }
        });

        // 速度滑桿
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            speedValue.textContent = `${this.speed}ms`;
        });
    }

    newGame() {
        this.score = 0;
        this.initializeBoard();
        this.updateDisplay();
        this.hideGameOver();
        this.predictQValues();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
            return true;
        }
        return false;
    }

    move(direction) {
        const previousBoard = this.board.map(row => [...row]);
        const previousScore = this.score;
        
        let moved = false;
        
        switch(direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }

        if (moved) {
            this.addRandomTile();
            this.updateDisplay();
            this.predictQValues();
            
            if (this.isGameOver()) {
                this.showGameOver();
                this.stopAutoPlay();
            }
            
            // 更新最高分
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('best2048', this.bestScore);
                this.updateBestScore();
            }
        }

        return moved;
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.board[i].filter(cell => cell !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row[j + 1] = 0;
                }
            }
            const newRow = row.filter(cell => cell !== 0);
            while (newRow.length < 4) {
                newRow.push(0);
            }
            
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] !== newRow[j]) {
                    moved = true;
                }
                this.board[i][j] = newRow[j];
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = this.board[i].filter(cell => cell !== 0).reverse();
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row[j + 1] = 0;
                }
            }
            const newRow = row.filter(cell => cell !== 0);
            while (newRow.length < 4) {
                newRow.push(0);
            }
            newRow.reverse();
            
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] !== newRow[j]) {
                    moved = true;
                }
                this.board[i][j] = newRow[j];
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = [];
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column[i + 1] = 0;
                }
            }
            
            const newColumn = column.filter(cell => cell !== 0);
            while (newColumn.length < 4) {
                newColumn.push(0);
            }
            
            for (let i = 0; i < 4; i++) {
                if (this.board[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[i][j] = newColumn[i];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            const column = [];
            for (let i = 3; i >= 0; i--) {
                if (this.board[i][j] !== 0) {
                    column.push(this.board[i][j]);
                }
            }
            
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column[i + 1] = 0;
                }
            }
            
            const newColumn = column.filter(cell => cell !== 0);
            while (newColumn.length < 4) {
                newColumn.push(0);
            }
            
            for (let i = 0; i < 4; i++) {
                if (this.board[3-i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.board[3-i][j] = newColumn[i];
            }
        }
        return moved;
    }

    updateDisplay() {
        const tiles = this.gameBoard.children;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const tileIndex = i * 4 + j;
                const tile = tiles[tileIndex];
                const value = this.board[i][j];
                
                tile.textContent = value === 0 ? '' : value;
                tile.className = value === 0 ? 'tile' : `tile tile-${value}`;
            }
        }
        
        this.scoreElement.textContent = this.score;
    }

    updateBestScore() {
        this.bestElement.textContent = this.bestScore;
    }

    // 將遊戲棋盤轉換為模型輸入格式
    boardToModelInput() {
        const batch_size = 1;
        const height = 4;
        const width = 4;
        const channels = 16;
        
        const input = new Float32Array(batch_size * height * width * channels);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = this.board[i][j];
                const baseIndex = (i * width + j) * channels;
                
                if (value === 0) {
                    input[baseIndex] = 1.0;
                } else {
                    const power = Math.log2(value);
                    input[baseIndex + power] = 1.0;
                }
            }
        }
        
        return input;
    }

    async predictQValues() {
        if (!this.session) {
            return;
        }

        try {
            const inputData = this.boardToModelInput();
            const inputTensor = new ort.Tensor('float32', inputData, [1, 4, 4, 16]);
            
            const feeds = { 'board_state': inputTensor };
            const results = await this.session.run(feeds);
            
            // 獲取 Q-Values
            const qValues = Array.from(results['q_values'].data);
            
            this.updateQValueDisplay(qValues);
        } catch (error) {
            console.error('Prediction error:', error);
            // 嘗試打印更多調試信息
            if (this.session && this.session.inputNames) {
                console.log('Model input names:', this.session.inputNames);
                console.log('Model output names:', this.session.outputNames);
            }
        }
    }

    updateQValueDisplay(qValues) {
        const directions = ['up', 'left', 'right', 'down'];
        const qValueElements = directions.map(dir => ({
            element: document.getElementById(`q-value-${dir}`),
            container: document.getElementById(`q-${dir}`),
            value: qValues[directions.indexOf(dir)]
        }));

        // 找到最大值
        const maxValue = Math.max(...qValues);
        
        // 更新顯示
        qValueElements.forEach(({ element, container, value }) => {
            element.textContent = value.toFixed(3);
            
            // 移除之前的 best 類
            container.classList.remove('best');
            
            // 為最大值添加高亮
            if (Math.abs(value - maxValue) < 1e-6) {
                container.classList.add('best');
            }
        });
    }

    aiStep() {
        if (this.isGameOver()) return;

        const moves = ['up', 'left', 'right', 'down'];
        const qValues = moves.map(dir =>
            parseFloat(document.getElementById(`q-value-${dir}`).textContent) || -Infinity
        );

        const sortedMoves = moves
            .map((move, index) => ({ move, q: qValues[index] }))
            .sort((a, b) => b.q - a.q);

        for (const moveInfo of sortedMoves) {
            if (this.move(moveInfo.move)) {
                break;
            }
        }
    }

    startAutoPlay() {
        if (this.isGameOver()) return;
        
        this.isAutoPlaying = true;
        const autoPlayBtn = document.getElementById('auto-play');
        autoPlayBtn.textContent = 'Stop Auto';
        autoPlayBtn.classList.add('btn-primary');
        autoPlayBtn.classList.remove('btn-secondary');
        
        this.autoPlayInterval = setInterval(() => {
            if (this.isGameOver()) {
                this.stopAutoPlay();
                return;
            }
            
            this.aiStep();
        }, this.speed);
    }

    stopAutoPlay() {
        this.isAutoPlaying = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        const autoPlayBtn = document.getElementById('auto-play');
        autoPlayBtn.textContent = 'Auto Play';
        autoPlayBtn.classList.remove('btn-primary');
        autoPlayBtn.classList.add('btn-secondary');
    }

    isGameOver() {
        // 檢查是否有空格
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) {
                    return false;
                }
            }
        }

        // 檢查是否有相鄰相同數字
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.board[i][j];
                if (
                    (i > 0 && this.board[i-1][j] === current) ||
                    (i < 3 && this.board[i+1][j] === current) ||
                    (j > 0 && this.board[i][j-1] === current) ||
                    (j < 3 && this.board[i][j+1] === current)
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    showGameOver() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <div>Game Over!</div>
            <div style="font-size: 0.7em; margin-top: 10px;">Final Score: ${this.score}</div>
        `;
        this.gameBoard.appendChild(gameOverDiv);
    }

    hideGameOver() {
        const gameOverDiv = this.gameBoard.querySelector('.game-over');
        if (gameOverDiv) {
            gameOverDiv.remove();
        }
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});