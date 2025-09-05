import { Share2, SearchCode, FilePlus } from 'lucide-react';
import { useGameMode } from '../contexts/GameModeContext';

const Toolbar = ({ onShare, onAnalyze, onImport }) => {
  const { isAnalyzing } = useGameMode();
  const buttonClass = "flex items-center justify-center w-8 h-8 rounded-lg bg-transparent transition-colors";

  return (
    <div className="flex mt-2 p-2 bg-gray-800 rounded-lg gap-2">
      <button className={buttonClass + " text-gray-500 hover:bg-gray-100"}>
        <Share2 onClick={onShare} />
      </button>
      <button 
        className={buttonClass + (isAnalyzing 
          ? " text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
          : " text-gray-500 hover:bg-gray-100"
        )}
        onClick={onAnalyze}
      >
        <SearchCode />
      </button>
      <button className={buttonClass + " text-gray-500 hover:bg-gray-100"}>
        <FilePlus onClick={onImport} />
      </button>
    </div>
  );
};

export default Toolbar;