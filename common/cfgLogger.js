'use strict';
// unit is byte
const MAX_LOG_SIZE = 1024 * 1024 * 20

function configLogger(logFilePath) {
  const log4js = require('log4js');
  let logStoreFilePath = logFilePath;
  if(!logStoreFilePath){
      let processCwd = process.cwd();
      let logFileName = 
          process.env.logFileName ?
          process.env.logFileName : `default.log`;
      console.log(`configLogger func : processCwd = ${processCwd} logFileName = ${logFileName}`);
      logStoreFilePath = `${processCwd}/Log/${logFileName}`;
      console.log(`configLogger func : logStoreFilePath = ${logStoreFilePath}`);
  }

  log4js.configure({
      appenders: {
          out: { type: 'stdout',layout: { type: 'colored' } },
          app: { type: 'file', filename: logStoreFilePath, maxLogSize: MAX_LOG_SIZE}
      },
      categories: {
          default: { appenders: [ 'out', 'app' ], level: 'debug' }
      }
  })
  return log4js
}

module.exports = configLogger
