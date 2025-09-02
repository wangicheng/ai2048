// src/lib/game.js

const GRID_SIZE = 4;

// Helper to create a new empty board
const createEmptyBoard = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

// Find all empty cells
const getEmptyCells = (board) => {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        cells.push([r, c]);
      }
    }
  }
  return cells;
};

// Add a new random tile (90% '2', 10% '4')
export const addRandomTile = (board) => {
  const newBoard = board.map(row => [...row]);
  const emptyCells = getEmptyCells(newBoard);
  if (emptyCells.length === 0) return { board: newBoard, added: null };
  
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { board: newBoard, added: { r, c, value: newBoard[r][c] } };
};

// Initialize game with two random tiles
export const initGame = () => {
  let { board, added: added1 } = addRandomTile(createEmptyBoard());
  let { board: finalBoard, added: added2 } = addRandomTile(board);
  return {
    board: finalBoard,
    score: 0,
    initialTiles: [
      added1,
      added2
    ],
  };
};

// Slide and merge a single row/column
const slideAndMerge = (line) => {
  const filtered = line.filter(v => v !== 0);
  const newLine = [];
  let scoreGained = 0;
  let merged = false;

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1] && !merged) {
      const mergedValue = filtered[i] * 2;
      newLine.push(mergedValue);
      scoreGained += mergedValue;
      i++; // Skip next element
      merged = true; // Prevents chain merges in one go
    } else {
      newLine.push(filtered[i]);
      merged = false;
    }
  }

  // Pad with zeros
  while (newLine.length < GRID_SIZE) {
    newLine.push(0);
  }
  return { line: newLine, scoreGained };
};

// Rotates the board 90 degrees clockwise
const rotateBoard = (board) => {
  const newBoard = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newBoard[c][GRID_SIZE - 1 - r] = board[r][c];
    }
  }
  return newBoard;
};

// Main move function
export const move = (board, direction) => {
  let currentBoard = board.map(row => [...row]);
  let scoreGained = 0;
  let rotations = 0;

  if (direction === 'up') { rotations = 3; }
  else if (direction === 'right') { rotations = 2; }
  else if (direction === 'down') { rotations = 1; }

  // Rotate to treat every move as a 'left' move
  for (let i = 0; i < rotations; i++) {
    currentBoard = rotateBoard(currentBoard);
  }

  // Slide and merge
  for (let r = 0; r < GRID_SIZE; r++) {
    const { line, scoreGained: lineScore } = slideAndMerge(currentBoard[r]);
    currentBoard[r] = line;
    scoreGained += lineScore;
  }
  
  // Rotate back
  for (let i = 0; i < (GRID_SIZE - rotations) % GRID_SIZE; i++) {
    currentBoard = rotateBoard(currentBoard);
  }
  
  const moved = JSON.stringify(board) !== JSON.stringify(currentBoard);

  return { board: currentBoard, scoreGained, moved };
};

// Convert array coordinates to 2048-GN notation
export const coordsToNotation = (r, c) => {
  const file = 'abcd'[c];
  const rank = '4321'[r];
  return `${file}${rank}`;
};
// Check if the game is over
export const isGameOver = (board) => {
  const GRID_SIZE = 4;
  // Check for any empty cells
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        return false; // Game is not over if there's an empty cell
      }
    }
  }

  // Check for possible merges
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const current = board[r][c];
      // Check right
      if (c < GRID_SIZE - 1 && current === board[r][c + 1]) {
        return false;
      }
      // Check down
      if (r < GRID_SIZE - 1 && current === board[r + 1][c]) {
        return false;
      }
    }
  }

  return true; // Board is full and no moves are possible
};

// 新增: 檢查特定方向的移動是否有效
export const canMove = (board, direction) => {
  const { moved } = move(board, direction);
  return moved;
};