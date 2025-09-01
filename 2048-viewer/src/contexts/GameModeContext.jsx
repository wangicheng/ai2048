import { createContext, useContext, useState } from 'react';

export const GameModeContext = createContext();

export const GameModeProvider = ({ children }) => {
  const [mode, setMode] = useState('play'); // 'play' or 'analyze'
  const [analysisGame, setAnalysisGame] = useState(null);
  
  const switchToAnalysis = (game) => {
    setMode('analyze');
    setAnalysisGame(game);
  };
  
  const switchToPlay = () => {
    setMode('play');
    setAnalysisGame(null);
  };
  
  return (
    <GameModeContext.Provider value={{
      mode,
      analysisGame,
      switchToAnalysis,
      switchToPlay
    }}>
      {children}
    </GameModeContext.Provider>
  );
};

export const useGameMode = () => useContext(GameModeContext);
