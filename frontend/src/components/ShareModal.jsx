import { useState, useCallback } from 'react';

function ShareModal({ pgn, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(pgn).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [pgn]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-gray-200 p-6 rounded-lg shadow-xl w-full max-w-md m-4 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-white">分享遊戲 (PGN)</h2>
        <textarea
          readOnly
          value={pgn}
          className="w-full h-48 p-3 bg-gray-900 text-gray-300 border border-gray-600 rounded resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors"
          >
            關閉
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            {copied ? '已複製!' : '複製'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;