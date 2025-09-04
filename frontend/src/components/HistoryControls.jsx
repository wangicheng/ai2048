import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const HistoryControls = ({ onFirst, onPrev, onTogglePlay, onNext, onLast, isPlaying }) => {
  const buttonClass = "flex flex-1 bg-gray-700 h-12 min-w-12 justify-center items-center hover:bg-gray-600 p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="mt-2 p-2 min-w-min bg-gray-800 rounded-lg flex gap-2">
      <button onClick={onFirst} className={buttonClass}><ChevronsLeft size={35} strokeWidth={3}/></button>
      <button onClick={onPrev} className={buttonClass}><ChevronLeft size={35} strokeWidth={3}/></button>
      <button onClick={onTogglePlay} className={buttonClass}>{isPlaying ? <Pause strokeWidth={3}/> : <Play strokeWidth={4}/>}</button>
      <button onClick={onNext} className={buttonClass}><ChevronRight size={35} strokeWidth={3}/></button>
      <button onClick={onLast} className={buttonClass}><ChevronsRight size={35} strokeWidth={3}/></button>
    </div>
  );
};

export default HistoryControls;