import { useEffect, useRef } from 'react';
import ArrowUp from "/arrow-up.svg";
import ArrowDown from "/arrow-down.svg";
import ArrowLeft from "/arrow-left.svg";
import ArrowRight from "/arrow-right.svg";

const moveIcons = {
  up: <img src={ArrowUp} />,
  down: <img src={ArrowDown} />,
  left: <img src={ArrowLeft} />,
  right: <img src={ArrowRight} />,
};

const MoveHistory = ({ history, currentViewIndex, onSelected }) => {
  const listRef = useRef(null);
  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentViewIndex]);

  return (
    <div className="flex-grow bg-gray-900/50 p-2 rounded-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
      <ol className="text-gray-300 text-sm">
        {history.slice(1).map((item, index) => (
          <li
            key={index}
            ref={index + 1 === currentViewIndex ? activeItemRef : null}
            // 增加 flex 和 items-center 讓排版更整齊
            className={`flex items-center p-1 rounded ${
              index + 1 === currentViewIndex ? 'bg-blue-500/50' : 'hover:bg-gray-700/50' + (index % 2 !== 0 ? ' bg-gray-800/50' : '')
            }`}
            onClick={() => onSelected(index)}
          >
            <span className="font-mono font-bold text-gray-400 w-12 inline-block">{item.moveNum}.</span>
            
            <span className="w-8 text-center">
              {moveIcons[item.move] || item.move} {/* 如果找不到對應圖示，則顯示原始文字 */}
            </span>
            
            <span className="font-mono ml-2 text-green-400">{item.notation}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MoveHistory;