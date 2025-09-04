import { useEffect, useRef, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ArrowUp from "/arrow-up.svg";
import ArrowDown from "/arrow-down.svg";
import ArrowLeft from "/arrow-left.svg";
import ArrowRight from "/arrow-right.svg";

const moveIcons = {
  up: <img src={ArrowUp} alt="up" />,
  down: <img src={ArrowDown} alt="down" />,
  left: <img src={ArrowLeft} alt="left" />,
  right: <img src={ArrowRight} alt="right" />,
};

// Memoize the Row component to prevent unnecessary re-renders during scrolling.
const Row = memo(({ index, style, data }) => {
  const { history, currentViewIndex, onSelected } = data;
  const item = history[index + 1];

  if (!item) {
    return <div style={style}></div>;
  }

  const isActive = index + 1 === currentViewIndex;

  // The 'style' prop is passed by react-window and is essential for positioning.
  return (
    <li
      style={style}
      className={`flex items-center p-1 rounded ${
        isActive
          ? 'bg-blue-500/50'
          : 'hover:bg-gray-700/50' + (index % 2 !== 0 ? ' bg-gray-800/50' : '')
      }`}
      onClick={() => onSelected(index)}
    >
      <span className="font-mono font-bold text-gray-400 w-12 inline-block">
        {item.moveNum}.
      </span>
      <span className="w-8 text-center">
        {moveIcons[item.move] || item.move}
      </span>
      <span className="font-mono ml-2 text-green-400">{item.notation}</span>
    </li>
  );
});

const MoveHistory = ({ history, currentViewIndex, onSelected }) => {
  const listRef = useRef(null);

  // Synchronize the list's scroll position with the current active move.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(currentViewIndex - 1, "smart");
    }
  }, [currentViewIndex]);

  return (
    <div className="flex-grow bg-gray-900/50 p-2 rounded-lg overflow-hidden">
      {/* AutoSizer provides the necessary width and height to the virtualized list. */}
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={listRef}
            className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"
            height={height}
            width={width}
            itemCount={Math.max(0, history.length - 1)}
            itemSize={32} // Specifies the fixed height of each row for rendering calculations.
            itemData={{ history, currentViewIndex, onSelected }} // Pass data to rows efficiently without breaking memoization.
            overscanCount={5} // Render items beyond the viewport to improve perceived scroll performance.
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default MoveHistory;