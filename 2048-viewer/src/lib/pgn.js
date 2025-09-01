// PGN parser for 2048 game notation
export function parsePGN(pgnText) {
  const lines = pgnText.split('\n');
  const tags = {};
  const moves = [];
  
  let currentSection = 'tags';
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    if (line.startsWith('[')) {
      // Parse tag pairs
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        tags[match[1]] = match[2];
      }
    } else {
      currentSection = 'movetext';
      
      // Skip comment lines
      if (line.startsWith('{')) continue;
      
      // Parse moves
      const moveRegex = /(\d+)\.\s+([UDLR])(?:[!?]+)?\s+(\d?)([a-d][1-4])/g;
      let match;
      
      while ((match = moveRegex.exec(line)) !== null) {
        moves.push({
          moveNum: parseInt(match[1]),
          direction: match[2].toLowerCase(),
          newTile: {
            value: match[3] ? parseInt(match[3]) : 2,
            position: match[4]
          }
        });
      }
    }
  }
  
  return { tags, moves };
}

// Convert coordinate (a1-d4) to array indices [row, col]
export function coordToIndices(coord) {
  const col = coord.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 4 - parseInt(coord[1]); // Convert from 1-4 to 0-3, inverted
  return [row, col];
}
