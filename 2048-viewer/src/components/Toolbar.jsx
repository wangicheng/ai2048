import { Share2, SearchCode } from 'lucide-react';

const Toolbar = ({ onShare, onAnalyze }) => {
  const buttonClass = "flex items-center justify-center w-8 h-8 rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 transition-colors";
  return (
    <div className="flex mt-2 p-2 bg-gray-800 rounded-lg gap-2">
      <button className={buttonClass}>
        <Share2 onClick={onShare} />
      </button>
      <button className={buttonClass}>
        <SearchCode onClick={onAnalyze} />
      </button>
    </div>
  );
};

export default Toolbar;