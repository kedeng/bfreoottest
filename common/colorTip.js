const colors = require('colors/safe')

function consoleTip(str) {
  console.log(colors.yellow(str))
}

function consoleError(str) {
  console.log(colors.red(str))
}

function consoleSuccess(str) {
  console.log(colors.green(str))
}

function consoleRainbow(str) {
  console.log(colors.rainbow(str))
}

module.exports = {
  consoleTip,
  consoleError,
  consoleSuccess,
  consoleRainbow
}
