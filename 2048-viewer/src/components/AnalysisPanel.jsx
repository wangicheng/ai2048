import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const AnalysisPanel = ({ evaluation }) => {
  const { value = 0, logits = [0, 0, 0, 0] } = evaluation || {};

  // -- Start of Changes --

  // 1. Calculate probabilities from logits using the Softmax function
  const maxLogit = Math.max(...logits);
  const exps = logits.map(logit => Math.exp(logit - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probabilities = sumExps > 0 
    ? exps.map(exp => exp / sumExps) 
    : [0.25, 0.25, 0.25, 0.25]; // Handle case where all logits are -Infinity or 0

  // -- End of Changes --

  const moveIcons = {
    up: <ArrowUp size={20} />,
    down: <ArrowDown size={20} />,
    left: <ArrowLeft size={20} />,
    right: <ArrowRight size={20} />
  };

  const moves = ['up', 'down', 'left', 'right'];

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold text-gray-300 mb-3">Analysis</h2>
      
      <div className="text-xl font-mono text-blue-400 mb-4">
        {value.toFixed(3)}
      </div>

      <div className="space-y-2">
        {moves.map((move, i) => {
          const probability = probabilities[i];
          const percentage = (probability * 100).toFixed(1);

          return (
            // Each row is a relative container to hold the background bar
            <div key={move} className="relative bg-gray-700/50 rounded overflow-hidden">
              {/* 3. Background bar based on probability */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-300 ease-in-out"
                style={{ width: `${percentage}%` }}
              />
              
              {/* Foreground content container */}
              <div className="relative flex items-center gap-3 text-gray-300 p-2">
                {/* 1. Probability on the left */}
                <span className="w-16 font-mono text-sm text-left">{percentage}%</span>
                <span className="w-8">{moveIcons[move]}</span>
                
                {/* Spacer to push logits to the right */}
                <div className="flex-grow" />

                {/* 2. Logits on the right */}
                <span className="font-mono text-sm">{logits[i].toFixed(3)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisPanel;