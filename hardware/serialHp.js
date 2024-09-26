const { SerialPort } = require('serialport')

async function checkPortAvailable(serailPath) {
  const serailPorts = await SerialPort.list()
  const arr = serailPorts.filter( item => {
    return item.path === serailPath
  })
  return arr.length ? true : false
}

module.exports = {
  checkPortAvailable
}
