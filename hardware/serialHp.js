const { SerialPort } = require('serialport')
const STMICROELECTRONICS = 'STMicroelectronics'

async function checkPortAvailable(serailPath) {
  const serailPorts = await SerialPort.list()
  const arr = serailPorts.filter( item => {
    return item.path === serailPath
  })
  return arr.length ? true : false
}

async function findStmFcPort() {
  const serailPorts = await SerialPort.list()
  for(let i = 0; i < serailPorts.length; i++) {
    const item = serailPorts[i]
    const { manufacturer, path } = item
    if (manufacturer.includes(STMICROELECTRONICS))
      return path
  }
  return null
}

module.exports = {
  checkPortAvailable,
  findStmFcPort
}
