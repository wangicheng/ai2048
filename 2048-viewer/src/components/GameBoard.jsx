import Scoreboard from './Scoreboard';
import Tile from './Tile';

const GameBoard = ({ board, score }) => {
  return (
    <div className="aspect-square responsive-square grid grid-cols-2 grid-rows-2 grid-cols-[1fr_15fr] grid-rows-[1fr_15fr] gap-4">
      <div className="col-start-2">
        <Scoreboard score={score} />
      </div>
      <div></div>
      <div className="grid grid-cols-4 grid-rows-4 gap-4 bg-gray-800 p-4 rounded-lg w-full h-full">
        {board.toReversed().flat().map((value, index) => (
          <Tile key={index} value={value} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;