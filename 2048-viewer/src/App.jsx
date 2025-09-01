import { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import MoveHistory from './components/MoveHistory';
import HistoryControls from './components/HistoryControls';
import Toolbar from './components/Toolbar';
import GameOverModal from './components/GameOverModal';
import AnalysisPanel from './components/AnalysisPanel';
import { initGame, move, addRandomTile, coordsToNotation, isGameOver } from './lib/game';
import { GameModeProvider, useGameMode } from './contexts/GameModeContext';
import { parsePGN } from './lib/pgn';

function AppContent() {
  const [history, setHistory] = useState([ { board: [], score: 0 } ]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [initialTiles, setInitialTiles] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  
  // Game state derived from history
  const currentGameState = history[currentViewIndex];
  const isViewingLatest = currentViewIndex === history.length - 1;
  const { mode, switchToAnalysis } = useGameMode();

  const resetGame = useCallback(() => {
    const { board, score, initialTiles: newInitialTiles } = initGame();
    setHistory([{ board, score, move: 'start', moveNum: 0, notation: '' }]);
    setInitialTiles(newInitialTiles);
    setCurrentViewIndex(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleKeyDown = useCallback((e) => {
    if (gameOver || !isViewingLatest) return; // Don't allow moves if game is over or not on latest view

    let direction = null;
    switch (e.key) {
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
      default: return;
    }
    e.preventDefault();

    const lastState = history[history.length - 1];
    const { board: movedBoard, scoreGained, moved } = move(lastState.board, direction);
    
    if (moved) {
      const { board: newBoard, added } = addRandomTile(movedBoard);
      const newScore = lastState.score + scoreGained;
      
      const newHistoryItem = {
        board: newBoard,
        score: newScore,
        move: direction,
        moveNum: history.length,
        notation: `${added.value === 4 ? '4' : ''}${coordsToNotation(added.r, added.c)}`
      };

      const newHistory = [...history, newHistoryItem];
      setHistory(newHistory);
      setCurrentViewIndex(newHistory.length - 1);

      // Check for game over condition
      if (isGameOver(newBoard)) {
        setGameOver(true);
      }
    }
  }, [history, isViewingLatest, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Autoplay functionality
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentViewIndex(prev => {
          if (prev < history.length - 1) {
            return prev + 1;
          }
          setIsPlaying(false); // Stop when it reaches the end
          return prev;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, history.length]);
  
  // PGN Generation
  const generatePGN = () => {
    const finalState = history[history.length - 1];
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
    const result = isGameOver(finalState.board) ? "Locked" : "*";

    const initialBoardNotation = initialTiles
      .map(tile => `${tile.value === 4 ? '4' : ''}${coordsToNotation(tile.r, tile.c)}`)
      .join(' ');

    let pgn = `[Event "React 2048 Game"]\n`;
    pgn += `[Site "Web Browser"]\n`;
    pgn += `[Date "${date}"]\n`;
    pgn += `[Player "Player"]\n`;
    pgn += `[InitialBoard "${initialBoardNotation}"]\n`;
    pgn += `[FinalScore "${finalState.score}"]\n`;
    pgn += `[Result "${result}"]\n\n`;

    const movetext = history
      .slice(1)
      .map(item => `${item.moveNum}. ${item.move[0].toUpperCase()} ${item.notation}`)
      .join(' ');
    pgn += movetext;
    
    if (isGameOver(finalState.board)) {
      pgn += ' Locked';
    }
    return pgn;
  };

  const handleShare = () => {
    const pgn = generatePGN();
    console.log(pgn);
  };

  const handleAnalyze = () => {
    const pgn = generatePGN();
    switchToAnalysis({
      pgn,
      history
    });
  };

  if (history[0].board.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-dvh h-dvh justify-center p-4">
      <div className="flex flex-col max-w-7xl max-h-dvh lg:flex-row gap-4 w-full mx-auto lg:items-start flex-1 min-h-0">
        
        {/* Left Column */}
        <div className="flex flex-col w-full lg:w-2/3 h-full min-h-0">
          <GameBoard 
            board={currentGameState.board} 
            score={currentGameState.score} 
            onEvaluationChange={setEvaluation}
          />
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 min-w-min lg:h-full flex flex-col">
          {mode === 'analyze' && <AnalysisPanel evaluation={evaluation} />}
          <div className="hidden lg:flex lg:flex-col flex-1 min-h-0">
            <MoveHistory
              history={history}
              currentViewIndex={currentViewIndex}
              onSelected={(index) => setCurrentViewIndex(index + 1)}
            />
          </div>
          <HistoryControls
            isPlaying={isPlaying}
            onFirst={() => setCurrentViewIndex(0)}
            onPrev={() => setCurrentViewIndex(p => Math.max(0, p - 1))}
            onNext={() => setCurrentViewIndex(p => Math.min(history.length - 1, p + 1))}
            onLast={() => setCurrentViewIndex(history.length - 1)}
            onTogglePlay={() => setIsPlaying(p => !p)}
          />
          <Toolbar onShare={handleShare} onAnalyze={handleAnalyze} />
        </div>

      </div>
      
      {/* Game Over Modal */}
      {gameOver && mode === 'play' && (
        <GameOverModal 
          score={history[history.length - 1].score}
          onPlayAgain={resetGame}
          onAnalyze={handleAnalyze}
          onClose={() => setGameOver(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <GameModeProvider>
      <AppContent />
    </GameModeProvider>
  );
}

export default App;