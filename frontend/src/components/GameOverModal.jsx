const GameOverModal = ({ score, onPlayAgain, onAnalyze, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-gray-800 text-white rounded-lg p-8 shadow-xl relative w-full max-w-sm mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-3xl font-bold text-center mb-4">Game Over</h2>

        <div className="bg-gray-700 p-4 rounded-md text-center mb-6">
          <p className="text-sm text-gray-400">FINAL SCORE</p>
          <p className="text-4xl font-bold">{score}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onAnalyze}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Analyze Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;