import { getTileStyle } from '../lib/colors';

const Tile = ({ value }) => {
  const style = getTileStyle(value);
  const text = value !== 0 ? value : '';

  return (
    <div className={`w-full h-full ${style}`}>
      {text}
    </div>
  );
};

export default Tile;