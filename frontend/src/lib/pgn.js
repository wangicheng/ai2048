// 為了重演遊戲，我們需要從核心遊戲邏輯中匯入 'move' 函式
// 確保您的 'game.js' 檔案有匯出 'move' 函式
import { move } from './game';

/**
 * 將 2048-GN 座標表示法 (例如 "a1", "d4") 轉換為板陣列索引。
 * @param {string} notation - 格式為 "c4" 的座標字串。
 * @returns {{r: number, c: number}} - { r, c } 索引物件。 r: 0-3 (上到下), c: 0-3 (左到右)。
 */
function notationToCoords(notation) {
  if (!notation || notation.length !== 2) {
    throw new Error(`Invalid coordinate notation: ${notation}`);
  }
  const colChar = notation.charAt(0).toLowerCase();
  const rowChar = notation.charAt(1);

  const c = colChar.charCodeAt(0) - 'a'.charCodeAt(0);
  const r = 4 - parseInt(rowChar, 10);

  if (c < 0 || c > 3 || r < 0 || r > 3 || isNaN(r)) {
    throw new Error(`Coordinate out of bounds: ${notation}`);
  }

  return { r, c };
}

/**
 * 解析新方塊的表示法 (例如 "c4", "4a1")。
 * @param {string} tileNotation - 方塊表示法字串。
 * @returns {{value: number, r: number, c: number}} - 包含數值和索引的物件。
 */
function parseTileNotation(tileNotation) {
  const match = tileNotation.match(/^(4|8|16|32)?([a-d][1-4])$/);
  if (!match) {
    throw new Error(`Invalid tile notation: ${tileNotation}`);
  }

  const value = match[1] ? parseInt(match[1], 10) : 2;
  const notation = match[2];
  const { r, c } = notationToCoords(notation);

  return { value, r, c };
}

/**
 * 解析一個完整的 2048-GN 格式字串並返回一個遊戲資料物件。
 * @param {string} pgnString - 包含 2048-GN 內容的字串。
 * @returns {{history: Array<object>, initialTiles: Array<object>}} - gameData 物件。
 */
export function parsePGN(pgnString) {
  if (!pgnString || typeof pgnString !== 'string') {
    throw new Error("Input must be a non-empty string.");
  }

  // 1. 分離標籤和移動文本
  const normalizedPgn = pgnString.replace(/\r\n/g, '\n');
  const parts = normalizedPgn.split(/\n\n+/);
  if (parts.length < 1) {
    throw new Error("Invalid PGN format: No content found.");
  }
  const headerStr = parts[0];
  const movetextStr = parts.slice(1).join('\n\n');

  // 2. 解析標籤 (Header)
  const tags = {};
  const tagRegex = /\[\s*(\w+)\s*"([^"]+)"\s*\]/g;
  let match;
  while ((match = tagRegex.exec(headerStr)) !== null) {
    tags[match[1]] = match[2];
  }

  if (!tags.InitialBoard) {
    throw new Error("Mandatory tag [InitialBoard] not found.");
  }

  // 3. 處理 InitialBoard 並建立初始狀態
  const initialTiles = tags.InitialBoard.split(' ').map(parseTileNotation);
  const history = [];

  const initialBoard = Array(4).fill(0).map(() => Array(4).fill(0));
  initialTiles.forEach(tile => {
    initialBoard[tile.r][tile.c] = tile.value;
  });

  history.push({
    board: initialBoard,
    score: 0,
    move: 'start',
    moveNum: 0,
    notation: '',
  });

  // 4. 解析移動文本 (Movetext)
  // 清理移動文本：移除註解、換行符和多餘空格
  const cleanedMovetext = movetextStr
    .replace(/\{[^}]*\}/g, '')      // 移除 { ... } 註解
    .replace(/(Locked|Retired|\*)$/, '') // 移除結束標記
    .replace(/\n/g, ' ')            // 將換行符轉為空格
    .replace(/\s+/g, ' ')           // 將多個空格合併為一個
    .trim();

  if (!cleanedMovetext) {
    // 如果沒有移動，直接返回初始狀態
    return { history, initialTiles };
  }

  // 按移動序號分割
  const moves = cleanedMovetext.split(/\d+\.\s*/).filter(Boolean);

  for (const moveStr of moves) {
    const lastState = history[history.length - 1];
    const moveParts = moveStr.trim().split(/\s+/);

    if (moveParts.length < 2) continue; // 忽略不完整的移動

    const playerMoveRaw = moveParts[0];
    const newTileNotation = moveParts[1];

    // 移除 NAGs (例如 !, ??)
    const playerMoveChar = playerMoveRaw.replace(/[!?]/g, '');

    const directionMap = { 'U': 'up', 'D': 'down', 'L': 'left', 'R': 'right' };
    const direction = directionMap[playerMoveChar];

    if (!direction) {
      throw new Error(`Invalid move direction: ${playerMoveChar}`);
    }

    // 5. 重演遊戲
    // a. 執行玩家移動
    const { board: movedBoard, scoreGained } = move(lastState.board, direction);
    
    // b. 放置新生成的方塊
    const newBoard = movedBoard.map(row => [...row]); // 建立深拷貝
    const newTile = parseTileNotation(newTileNotation);
    
    // 檢查新方塊位置是否為空
    if (newBoard[newTile.r][newTile.c] !== 0) {
      throw new Error(`Tile spawn conflict at ${newTileNotation} on move ${history.length}`);
    }
    newBoard[newTile.r][newTile.c] = newTile.value;

    // c. 建立新的歷史紀錄
    const newHistoryItem = {
      board: newBoard,
      score: lastState.score + scoreGained,
      move: direction,
      moveNum: history.length,
      notation: newTileNotation,
    };
    
    history.push(newHistoryItem);
  }

  return { history, initialTiles };
}