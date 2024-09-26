const { SerialPort } = require('serialport')

async function serialPortCheck(taskName, gApp) {
  const ports = await SerialPort.list()
  gApp.appSt.setSerialPorts(ports)
}

function checkSerialsIsSame(preArr, newArr) {
  if (preArr.length !== newArr.length)
    return false
  for(let i = 0; i < preArr.length; i++) {
    const perItem = preArr[i]
    const curItem = newArr[i]
    if (perItem.path !== curItem.path)
      return false
  }
  return true
}

module.exports = {
  serialPortCheck,
  checkSerialsIsSame
}
