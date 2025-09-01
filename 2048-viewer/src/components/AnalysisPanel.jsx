import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';

// 假設每個項目含間距的高度是固定的，這裡我們假設 p-2 + space-y-2 的結果大約是 48px
// 你可以根據你的實際樣式微調這個值
const ITEM_HEIGHT = 48; // 每個項目含上下邊距的總高度

const AnalysisPanel = ({ evaluation }) => {
  const { value = 0, logits = [0, 0, 0, 0] } = evaluation || {};

  const moveIcons = {
    up: <ArrowUp size={20} />,
    down: <ArrowDown size={20} />,
    left: <ArrowLeft size={20} />,
    right: <ArrowRight size={20} />
  };

  const moves = ['up', 'down', 'left', 'right'];

  // -- Start of Changes --

  // 1. 計算 probabilities 並建立一個包含排序後位置的 map
  const movePositions = useMemo(() => {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(logit => Math.exp(logit - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = sumExps > 0
      ? exps.map(exp => exp / sumExps)
      : [0.25, 0.25, 0.25, 0.25];

    const movesWithData = moves.map((move, i) => ({
      id: move,
      probability: probabilities[i],
      logit: logits[i],
    }));

    // 根據 probability 降序排列
    const sortedMoves = movesWithData.sort((a, b) => b.probability - a.probability);

    // 建立一個 map，key 是 move 的 id，value 是它在排序後的索引 (0, 1, 2, 3)
    // 例如：{ up: 0, left: 1, down: 2, right: 3 }
    const positions = {};
    sortedMoves.forEach((move, index) => {
      positions[move.id] = index;
    });
    return positions;
  }, [logits]);

  // -- End of Changes --

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
              <div className="relative bg-gray-700/50 rounded overflow-hidden">
                {/* 背景進度條 */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-300 ease-in-out"
                  style={{ width: `${percentage}%` }}
                />
                
                {/* 前景內容 */}
                <div className="relative flex items-center gap-3 text-gray-300 p-2">
                  <span className="w-16 font-mono text-sm text-left">{percentage}%</span>
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