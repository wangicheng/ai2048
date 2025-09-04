// src/lib/colors.js

export const TILE_COLORS = {
  2: "bg-[#eee4da] text-[#776e65]",
  4: "bg-[#ede0c8] text-[#776e65]",
  8: "bg-[#f2b179] text-white",
  16: "bg-[#f59563] text-white",
  32: "bg-[#f67c5f] text-white",
  64: "bg-[#f65e3b] text-white",
  128: "bg-[#edcf72] text-white",
  256: "bg-[#edcc61] text-white",
  512: "bg-[#edc850] text-white",
  1024: "bg-[#edc53f] text-white",
  2048: "bg-[#edc22e] text-white",
};

export const getTileStyle = (value) => {
  const baseStyle = "flex items-center justify-center font-bold rounded-md text-4xl min-w-3xs min-h-3xs";
  if (value === 0) return "bg-gray-700/50 rounded-md";
  const colorStyle = TILE_COLORS[value] || "bg-[#3c3a32] text-white";
  return `${baseStyle} ${colorStyle}`;
};