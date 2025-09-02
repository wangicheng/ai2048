import { createContext, useContext, useState } from 'react';

export const GameModeContext = createContext();

export const GameModeProvider = ({ children }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  return (
    <GameModeContext.Provider value={{
      isAnalyzing,
      toggleAnalysis: () => setIsAnalyzing(prev => !prev)
    }}>
      {children}
    </GameModeContext.Provider>
  );
};

export const useGameMode = () => useContext(GameModeContext);
