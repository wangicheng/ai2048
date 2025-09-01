import { Share2 } from 'lucide-react';

const Toolbar = () => {
  const buttonClass = "flex items-center justify-center w-8 h-8 rounded-lg bg-transparent text-gray-500 hover:bg-gray-100 transition-colors";
  return (
    <div className="mt-2 p-2 bg-gray-800 rounded-lg">
      <button className={buttonClass}>
        <Share2 />
      </button>
    </div>
  );
};

export default Toolbar;