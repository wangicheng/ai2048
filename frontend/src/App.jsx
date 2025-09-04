import { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import MoveHistory from './components/MoveHistory';
import HistoryControls from './components/HistoryControls';
import Toolbar from './components/Toolbar';
import GameOverModal from './components/GameOverModal';
import AnalysisPanel from './components/AnalysisPanel';
import ShareModal from './components/ShareModal';
import { initGame, move, addRandomTile, coordsToNotation, isGameOver, canMove } from './lib/game';
import { GameModeProvider, useGameMode } from './contexts/GameModeContext';
import { parsePGN } from './lib/pgn';
import { evaluatePosition } from './lib/engine';

function AppContent() {
  const [history, setHistory] = useState([ { board: [], score: 0 } ]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [initialTiles, setInitialTiles] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pgnToShare, setPgnToShare] = useState('');
  const botMoveInterval = useRef(null);
  const botMoveTimeout = useRef(null);
  const isBKeyDown = useRef(false);
  const isEvaluating = useRef(false);
  const historyRef = useRef(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  
  const currentGameState = history[currentViewIndex];
  const isViewingLatest = currentViewIndex === history.length - 1;
  const { mode, switchToAnalysis, isAnalyzing, toggleAnalysis } = useGameMode();

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

  const makeMove = useCallback((direction) => {
    if (gameOver || !isViewingLatest) return;

    setHistory(prevHistory => {
      const lastState = prevHistory[prevHistory.length - 1];
      const { board: movedBoard, scoreGained, moved } = move(lastState.board, direction);
      
      if (moved) {
        const { board: newBoard, added } = addRandomTile(movedBoard);
        const newScore = lastState.score + scoreGained;
        
        const newHistoryItem = {
          board: newBoard,
          score: newScore,
          move: direction,
          moveNum: prevHistory.length,
          notation: `${added.value === 4 ? '4' : ''}${coordsToNotation(added.r, added.c)}`
        };

        const newHistory = [...prevHistory, newHistoryItem];
        
        setCurrentViewIndex(newHistory.length - 1);

        if (isGameOver(newBoard)) {
          setGameOver(true);
        }

        return newHistory;
      }

      return prevHistory;
    });
  }, [gameOver, isViewingLatest]);

  const handleKeyDown = useCallback((e) => {
    if (gameOver || !isViewingLatest || showShareModal) return;

    let direction = null;
    switch (e.key) {
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
      default: return;
    }
    e.preventDefault();
    makeMove(direction);
  }, [gameOver, isViewingLatest, showShareModal, makeMove]);

  const handleBotMove = useCallback(async () => {
    if (gameOver || !isViewingLatest || !isAnalyzing || isEvaluating.current) {
        return;
    }

    try {
        isEvaluating.current = true;

        const currentHistory = historyRef.current;
        const lastState = currentHistory[currentHistory.length - 1];
        if (!lastState || !lastState.board) return;

        const board = lastState.board;
        const { logits } = await evaluatePosition(board);

        const moves = ['left', 'right', 'up', 'down'];
        const moveData = moves.map((dir, i) => ({
            direction: dir,
            logit: logits[i],
            isValid: canMove(board, dir)
        })).filter(m => m.isValid);

        if (moveData.length > 0) {
            moveData.sort((a, b) => b.logit - a.logit);
            makeMove(moveData[0].direction);
        }
    } catch (error) {
        console.error("Evaluation failed:", error);
    } finally {
        isEvaluating.current = false;
    }
  }, [gameOver, isViewingLatest, isAnalyzing, makeMove]);

  const handleBotKeyDown = useCallback((e) => {
    if (e.key.toLowerCase() !== 'b' || isBKeyDown.current || showShareModal) return;
    if (gameOver || !isViewingLatest || !isAnalyzing) return;

    e.preventDefault();
    isBKeyDown.current = true;

    handleBotMove();

    botMoveTimeout.current = setTimeout(() => {
      if (botMoveInterval.current) clearInterval(botMoveInterval.current);
      botMoveInterval.current = setInterval(handleBotMove, 10);
    }, 500);

  }, [handleBotMove, gameOver, isViewingLatest, isAnalyzing, showShareModal]);

  const handleBotKeyUp = useCallback((e) => {
    if (e.key.toLowerCase() !== 'b') return;
    isBKeyDown.current = false;
    clearTimeout(botMoveTimeout.current);
    clearInterval(botMoveInterval.current);
    botMoveInterval.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleBotKeyDown);
    window.addEventListener('keyup', handleBotKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleBotKeyDown);
      window.removeEventListener('keyup', handleBotKeyUp);
    };
  }, [handleKeyDown, handleBotKeyDown, handleBotKeyUp]);

  useEffect(() => {
    return () => {
      clearTimeout(botMoveTimeout.current);
      clearInterval(botMoveInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentViewIndex(prev => {
          if (prev < history.length - 1) {
            return prev + 1;
          }
          setIsPlaying(false);
          return prev;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, history.length]);
  
  const generatePGN = useCallback(() => {
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
  }, [history, initialTiles]);

  const handleShare = () => {
    const pgn = generatePGN();
    setPgnToShare(pgn);
    setShowShareModal(true);
  };

  const handleAnalyze = () => {
    toggleAnalysis();
  };

  useEffect(() => {
    if (isAnalyzing && currentGameState?.board?.length) {
        if (isEvaluating.current) return;
        isEvaluating.current = true;
        evaluatePosition(currentGameState.board).then((result) => {
            setEvaluation(result);
        }).finally(() => {
            isEvaluating.current = false;
        });
    } else {
      setEvaluation(null);
    }
  }, [currentGameState.board, isAnalyzing]);

  if (history[0].board.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-dvh h-dvh justify-center p-4">
      <div className="flex flex-col max-w-7xl max-h-dvh lg:flex-row gap-4 w-full mx-auto lg:items-start flex-1 min-h-0">
        <div className="flex flex-col w-full lg:w-2/3 h-full min-h-0">
          <GameBoard 
            board={currentGameState.board} 
            score={currentGameState.score} 
            evaluation={evaluation}
          />
        </div>

        <div className="w-full lg:w-1/3 min-w-min lg:h-full flex flex-col">
          {isAnalyzing && 
            <AnalysisPanel 
              evaluation={evaluation} 
              board={currentGameState.board}
            />
          }
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
      
      {gameOver && !isAnalyzing && (
        <GameOverModal 
          score={history[history.length - 1].score}
          onPlayAgain={resetGame}
          onAnalyze={handleAnalyze}
          onClose={() => setGameOver(false)}
        />
      )}

      {showShareModal && (
        <ShareModal 
          pgn={pgnToShare}
          onClose={() => setShowShareModal(false)}
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