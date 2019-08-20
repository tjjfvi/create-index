import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import chalk from 'chalk';
import createIndexCode from './createIndexCode';
import validateTargetDirectory from './validateTargetDirectory';
import readDirectory from './readDirectory';
import readIndexConfig from './readIndexConfig';
import sortByDepth from './sortByDepth';
import log from './log';
import findIndexFiles from './findIndexFiles';
import {CREATE_INDEX_PATTERN} from './constants';

export default (directoryPaths, options = {}) => {
  let sortedDirectoryPaths;

  sortedDirectoryPaths = sortByDepth(directoryPaths);

  log('Target directories', sortedDirectoryPaths);
  if (options.updateIndex) {
    log('Update index:', options.updateIndex ? chalk.green('true') : chalk.red('false'));
  } else {
    log('Recursive:', options.recursive ? chalk.green('true') : chalk.red('false'));
    log('Ignore unsafe:', options.ignoreUnsafe ? chalk.green('true') : chalk.red('false'));
    log('Extensions:', chalk.green(options.extensions));
  }

  if (options.updateIndex || options.recursive) {
    sortedDirectoryPaths = _.map(sortedDirectoryPaths, (dir) => {
      return findIndexFiles(dir, {
        fileName: options.updateIndex ? 'index.js' : '*',
        silent: options.updateIndex || options.ignoreUnsafe
      });
    });
    sortedDirectoryPaths = _.flatten(sortedDirectoryPaths);
    sortedDirectoryPaths = _.uniq(sortedDirectoryPaths);
    sortedDirectoryPaths = sortByDepth(sortedDirectoryPaths);

    log('Updating index files in:', sortedDirectoryPaths.reverse().join(', '));
  }

  sortedDirectoryPaths = sortedDirectoryPaths.filter((directoryPath) => {
    return validateTargetDirectory(directoryPath, {silent: options.ignoreUnsafe});
  });

  _.forEach(sortedDirectoryPaths, (directoryPath) => {
    let existingIndexCode;

    const config = readIndexConfig(directoryPath);

    const siblings = readDirectory(directoryPath, {
      config,
      extensions: options.extensions,
      ignoreDirectories: options.ignoreDirectories,
      silent: options.ignoreUnsafe
    });

    const indexFilePath = path.resolve(directoryPath, 'index.js');

    try {
      existingIndexCode = fs.readFileSync(indexFilePath, 'utf8');
    } catch (error) {
      existingIndexCode = '';
    }

    const initCode = existingIndexCode.split(CREATE_INDEX_PATTERN)[0] || '';

    const indexCode = createIndexCode(siblings, {
      banner: options.banner,
      config
    }, initCode);

    fs.writeFileSync(indexFilePath, indexCode);

    if (existingIndexCode && existingIndexCode === indexCode) {
      log(indexFilePath, chalk.yellow('[index has not changed]'));
    } else if (existingIndexCode && existingIndexCode !== indexCode) {
      log(indexFilePath, chalk.green('[updated index]'));
    } else {
      log(indexFilePath, chalk.green('[created index]'));
    }
  });

  log('Done');
};
