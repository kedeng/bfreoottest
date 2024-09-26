/*
 1. connect fc port
 2. enter cli mode
 3. send 'exit'
 4. wait until reboot success and repeat test steps
 */
const fcSerial = require('./hardware/fcSerial')
const { checkPortAvailable } = require('./hardware/serialHp')
const { myLogger, gApp } = require('./test/testHp')
const { sleep } = require('./utils/support')

const FC_PORT_PATH = "COM5"
const MAX_CHECK_CLOSE_TIP = 20

const processData = (_, chunk, type) => {
  myLogger.info(`processData func start: type = ${type}`)
  if (type === 'close')
    gApp.serialIsClosed = true
  if (chunk)
    myLogger.info(chunk.toString())
}

const checkSerialHaveClosed = async (maxWaitTimes) => {
  gApp.checkCloseTick = 0
  while(!gApp.serialIsClosed) {
    await sleep(1000)
    gApp.checkCloseTick++
    if (gApp.checkCloseTick > maxWaitTimes) {
      myLogger.info(`Check ${FC_PORT_PATH} not closed after exit command`)
      process.exit(-1)
      return
    }
  }
}

const checkFcHaveReboot = async (maxWaitTimes) => {
  gApp.checkRebootTick = 0
  while(!checkPortAvailable(FC_PORT_PATH)) {
    await sleep(1000)
    gApp.checkRebootTick++
    if (gApp.checkRebootTick > maxWaitTimes) {
      myLogger.info(`Check ${FC_PORT_PATH} not reboot after exit command`)
      process.exit(-1)
      return
    }
  }
}

async function start() {
  const isPortAvailable = await checkPortAvailable(FC_PORT_PATH)
  if (!isPortAvailable) {
    myLogger.error(`${FC_PORT_PATH} not available`)
    return
  }
  fcSerial.setGApp(gApp)
  gApp.testTimes = 1
  while(true) {
    myLogger.info(`========${gApp.testTimes}============`)
    const rt = await fcSerial.connect({
      path: FC_PORT_PATH,
      baudRate: 115200
    })
    gApp.serialIsClosed = false
    fcSerial.listen(processData)
    fcSerial.write('#\n')
    await sleep(1000)
    fcSerial.write(`exit\n`)
    await checkSerialHaveClosed(10)
    gApp.testTimes++
    await sleep(1000)
    await checkFcHaveReboot(10)
    myLogger.info(`=====================================`)
  }
}


start()
