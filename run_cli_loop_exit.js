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
const DEFAULT_PORT = "COM5"
const FC_PORT_PATH = getTestPort()
const MAX_CHECK_CLOSE_TIP = 20

function getTestPort() {
  if (process.env.port)
    return process.env.port
  return DEFAULT_PORT
}

function processData(_, chunk, type) {
  myLogger.info(`processData func start: type = ${type}`)
  if (type === 'close')
    gApp.serialIsClosed = true
  if (chunk)
    myLogger.info(chunk.toString())
}

async function checkSerialHaveClosed(maxWaitTimes) {
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

async function checkFcHaveReboot(maxWaitTimes) {
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
  await sleep(1000)
}

async function setMotorPwmProtocol(protocol) {
  myLogger.info(`try set motor pwm protocol: ${protocol}`)
    await fcSerial.connect({
      path: FC_PORT_PATH,
      baudRate: 115200
    })
    gApp.serialIsClosed = false
    fcSerial.write('#\n')
    await sleep(1000)
    fcSerial.write('set motor_pwm_protocol = PWM\n')
    await sleep(1000)
    fcSerial.write(`save\n`)
    await checkSerialHaveClosed(10)
    await sleep(1000)
    await checkFcHaveReboot(10)
}

async function start() {
  myLogger.info(`start test FC_PORT_PATH = ${FC_PORT_PATH}`)
  const isPortAvailable = await checkPortAvailable(FC_PORT_PATH)
  if (!isPortAvailable) {
    myLogger.error(`${FC_PORT_PATH} not available`)
    return
  }
  fcSerial.setGApp(gApp)
  fcSerial.listen(processData)
  gApp.testTimes = 1
  await setMotorPwmProtocol('PWM')
  while(true) {
    myLogger.info(`===============${gApp.testTimes}===============`)
    await fcSerial.connect({
      path: FC_PORT_PATH,
      baudRate: 115200
    })
    gApp.serialIsClosed = false
    fcSerial.write('#\n')
    await sleep(1000)
    fcSerial.write(`exit\n`)
    await checkSerialHaveClosed(10)
    gApp.testTimes++
    await sleep(1000)
    await checkFcHaveReboot(10)
  }
}

start()
