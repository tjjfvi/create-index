import path from 'path';
import _ from 'lodash';

const safeVariableName = (fileName) => {
  const indexOfDot = fileName.indexOf('.');

  if (indexOfDot === -1) {
    return fileName;
  } else {
    return fileName.slice(0, indexOfDot);
  }
};

const buildExportBlock = (files, config = {}) => {
  const {mode = 'default,*'} = config;

  if (config.mode === 'default') {
    return files.map((fileName) => `export { default as ${safeVariableName(fileName)} } from './${fileName}';`).join('\n');
  } else if (mode === '*') {
    return files.map((fileName) => `export * from './${fileName}';`).join('\n');
  } else if (mode === 'named*') {
    return files.map((fileName) => `import * as ${safeVariableName(fileName)} from './${fileName}';`).join('\n') +
    `\nexport { ${files.map(safeVariableName).join(', ')} };`;
  } else if (mode === 'default,*') {
    return files.map((fileName) => {
      return `
      export { default as ${safeVariableName(fileName)} } from './${fileName}';
      export * from './${fileName}';
    `.trim().split('\n').map((line) => {
      return line.trim();
    });
    }).reduce((a, b) => {
      return a.map((x, i) => x + '\n' + b[i]);
    }, ['', '']).join('').slice(1);
  } else if (mode === 'default{}') {
    return files.map((fileName) => `import ${safeVariableName(fileName)} from './${fileName}';`).join('\n') +
    `\nexport default { ${files.map(safeVariableName).join(', ')} };`;
  }

  throw new Error(`Invalid mode '${mode}'`);
};

export default (filePaths, options = {}, initCode = '') => {
  let code;
  let configCode;

  code = initCode;
  configCode = '';

  if (options.banner) {
    const banners = _.isArray(options.banner) ? options.banner : [options.banner];

    banners.forEach((banner) => {
      code += banner + '\n';
    });

    code += '\n';
  }

  if (options.config && _.size(options.config) > 0) {
    configCode += ' ' + JSON.stringify(options.config);
  }

  code += '// @create-index' + configCode + '\n\n';

  if (filePaths.length) {
    let sortedFilePaths;

    sortedFilePaths = filePaths.sort();

    if (options.stripExtension) {
      sortedFilePaths = sortedFilePaths.map((x) => x.slice(0, -path.extname(x).length || Infinity));
    }

    code += buildExportBlock(sortedFilePaths, options.config) + '\n\n';
  }

  return code;
};
