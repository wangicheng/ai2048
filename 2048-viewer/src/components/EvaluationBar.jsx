const EvaluationBar = ({ score = 1 }) => {
  // 定義評價值範圍的對數邊界
  const MIN_LOG_SCORE = 3; // log10(1000)
  const MAX_LOG_SCORE = 6; // log10(1000000)

  // 確保 score 在有效範圍內 [1000, 1000000]，避免 log(0) 或負數
  const clampedScore = Math.max(1000, Math.min(score, 1000000));

  // 使用對數轉換，讓評價值在視覺上更均勻
  // log10(1000) = 3, log10(1000000) = 6
  const logScore = Math.log10(clampedScore);

  const advantagePercent = ((logScore - MIN_LOG_SCORE) / (MAX_LOG_SCORE - MIN_LOG_SCORE)) * 100;
  
  const whiteHeightPercent = advantagePercent;
  
  const blackHeightPercent = 100 - whiteHeightPercent;

  return (
    <div className="w-4 h-full flex flex-col rounded-lg overflow-hidden">
      {/* 黑色部分 (上方) */}
      <div
        className="bg-gray-800 transition-all duration-500 ease-in-out"
        style={{ height: `${blackHeightPercent}%` }}
        aria-label="Black's evaluation"
      />
      {/* 白色部分 (下方) */}
      <div
        className="bg-white transition-all duration-500 ease-in-out"
        style={{ height: `${whiteHeightPercent}%` }}
        aria-label="White's evaluation"
      />
    </div>
  );
};

export default EvaluationBar;