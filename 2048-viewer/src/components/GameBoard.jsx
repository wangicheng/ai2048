import EvaluationBar from './EvaluationBar';
import Scoreboard from './Scoreboard';
import Tile from './Tile';

const GameBoard = ({ board, score }) => {
  return (
    <div className="flex-1 min-h-min mt-16 ml-8 place-items-center square-container">
      <div className="aspect-square responsive-square gap-4 relative">
        <div className="absolute -top-16 left-0">
          <Scoreboard score={score} />
        </div>
        <div className="absolute top-0 -left-8 h-full">
          <EvaluationBar score={score} />
        </div>
        <div className="absolute top-0 left-0 grid grid-cols-4 grid-rows-4 gap-4 bg-gray-800 p-4 rounded-lg w-full h-full">
          {board.toReversed().flat().map((value, index) => (
            <Tile key={index} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;