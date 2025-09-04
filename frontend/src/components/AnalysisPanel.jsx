import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { canMove } from '../lib/game';

// 假設每個項目含間距的高度是固定的，這裡我們假設 p-2 + space-y-2 的結果大約是 48px
// 你可以根據你的實際樣式微調這個值
const ITEM_HEIGHT = 48; // 每個項目含上下邊距的總高度

const AnalysisPanel = ({ evaluation, board }) => {  // 添加 board 參數
  const { value = 0, logits = [0, 0, 0, 0] } = evaluation || {};

  const moveIcons = {
    up: <ArrowUp size={20} />,
    down: <ArrowDown size={20} />,
    left: <ArrowLeft size={20} />,
    right: <ArrowRight size={20} />
  };

  const moves = ['left', 'right', 'up', 'down'];

  const movePositions = useMemo(() => {
    // 檢查每個方向是否可以移動
    const validMoves = moves.map(move => canMove(board, move));
    
    const maxLogit = Math.max(...logits);
    const exps = logits.map(logit => Math.exp(logit - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = sumExps > 0
      ? exps.map(exp => exp / sumExps)
      : [0.25, 0.25, 0.25, 0.25];

    const movesWithData = moves.map((move, i) => ({
      id: move,
      probability: validMoves[i] ? probabilities[i] : 0, // 如果移動無效，機率設為 0
      logit: logits[i],
      isValid: validMoves[i],
    }));

    const sortedMoves = movesWithData.sort((a, b) => {
      if (a.isValid && !b.isValid) return -1;
      if (!a.isValid && b.isValid) return 1;
      return b.probability - a.probability;
    });

    const positions = {};
    sortedMoves.forEach((move, index) => {
      positions[move.id] = index;
    });
    return positions;
  }, [logits, board]);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold text-gray-300 mb-3">Analysis</h2>
      
      <div className="text-xl font-mono text-blue-400 mb-4">
        {value.toFixed(3)}
      </div>

      {/* 2. 建立一個相對定位的父容器，並手動計算其高度 */}
      <div className="relative" style={{ height: `${moves.length * ITEM_HEIGHT - 8}px` }}> {/* 減去最後一個元素的 space-y */}
        {moves.map((move, i) => {
          // 我們不再使用排序後的陣列，而是用原始的 moves 陣列
          // 這樣可以保證 DOM 結構穩定
          
          const maxLogit = Math.max(...logits);
          const exps = logits.map(l => Math.exp(l - maxLogit));
          const sumExps = exps.reduce((a, b) => a + b, 0);
          const probability = sumExps > 0 ? exps[i] / sumExps : 0.25;
          const percentage = (probability * 100).toFixed(1);
          const isValid = canMove(board, move);

          // 3. 從 map 中獲取這個 move 應該在的位置
          const targetPositionIndex = movePositions[move];
          // 計算 Y 軸需要移動的距離
          const yOffset = targetPositionIndex * ITEM_HEIGHT;

          return (
            // 4. 使用絕對定位，並透過 transform 來移動
            <div
              key={move}
              className="absolute w-full transition-transform duration-300 ease-in-out" // 加上 transition 相關 class
              style={{ transform: `translateY(${yOffset}px)` }} // 動態設定 transform
            >
              <div className={`relative ${isValid ? 'bg-gray-700/50' : 'bg-gray-800/50'} rounded overflow-hidden`}>
                {isValid && (
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-300 ease-in-out"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                
                <div className={`relative flex items-center gap-3 p-2 ${
                  isValid ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  <span className="w-16 font-mono text-sm text-left">
                    {isValid ? `${percentage}%` : 'blocked'}
                  </span>
                  <span className="w-8">{moveIcons[move]}</span>
                  <div className="flex-grow" />
                  <span className="font-mono text-sm">{logits[i].toFixed(3)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisPanel;