const Scoreboard = ({ score }) => {
  return (
    <div className="w-full flex items-center">
      <div className="h-12 bg-white text-black p-2 px-4 rounded-md flex items-center gap-3">
        <div className="text-xs font-bold text-gray-500">SCORE</div>
        <div className="text-2xl font-bold">{score}</div>
      </div>
    </div>
  );
};

export default Scoreboard;