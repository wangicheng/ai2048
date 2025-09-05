// src/components/PgnImporter.jsx
import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { parsePGN } from '../lib/pgn'; // 確保路徑正確

export default function PgnImporter({ onPgnLoad, onClose }) {
  const [pgnText, setPgnText] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.pgn')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPgnText(event.target.result);
        setError(null);
      };
      reader.onerror = () => {
        setError('讀取檔案時發生錯誤。');
      };
      reader.readAsText(file);
    } else if (file) {
      setError('請選擇一個 .pgn 格式的檔案。');
    }
  };

  const handleImport = () => {
    if (!pgnText.trim()) {
      setError('請貼上 PGN 文字或選擇一個檔案。');
      return;
    }
    try {
      const gameData = parsePGN(pgnText);
      onPgnLoad(gameData);
      onClose(); // 成功後關閉 modal
    } catch (err) {
      console.error('PGN parsing failed:', err);
      setError(`PGN 格式錯誤或無法解析: ${err.message}`);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">匯入 PGN</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <p className="text-gray-400 mb-4">
          您可以直接貼上 PGN 內容，或上傳一個 .pgn 檔案。
        </p>

        <textarea
          value={pgnText}
          onChange={(e) => {
            setPgnText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="[Event &quot;...&quot;]&#10;[Site &quot;...&quot;]&#10;...&#10;&#10;1. U a1 2. R c3..."
          className="w-full h-48 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
        />

        {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={triggerFileSelect}
            className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            選擇 .pgn 檔案
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pgn"
            className="hidden"
          />
          <button
            onClick={handleImport}
            className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            匯入
          </button>
        </div>
      </div>
    </div>
  );
}

PgnImporter.propTypes = {
  onPgnLoad: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};