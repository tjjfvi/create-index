import fs from 'fs';
import path from 'path';

export default (directoryPath, ext = 'js') => {
  const indexPath = path.resolve(directoryPath, 'index.' + ext);

  try {
    fs.statSync(indexPath);

    return true;
  } catch (error) {
    return false;
  }
};
