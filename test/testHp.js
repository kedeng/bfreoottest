const cfgLogger = require('../common/cfgLogger')
const myLogger = cfgLogger().getLogger('startTest:')

const gApp = {
  myLogger
}

module.exports = {
  myLogger,
  gApp
}
