/*
 1. connect fc port
 2. enter cli mode
 3. send 'exit'
 4. wait until reboot success and repeat test steps
 */
const util = require('util')
const fcSerial = require('./hardware/fcSerial')
const { checkPortAvailable } = require('./hardware/serialHp')
const { myLogger, gApp } = require('./test/testHp')
const { sleep } = require('./utils/support')
const DEFAULT_PORT = "COM5"
const DEFAULT_PWM_PROTOCOL = "PWM"
const FC_PORT_PATH = getTestPort()
const PWM_PROTOCOL = getTestPwmProtocol()
const MAX_CHECK_CLOSE_TIP = 20

function isDisSetProto() {
  console.log(`process.env.disSetProto = ${process.env.disSetProto}`)
  if (process.env.disSetProto.trim() === "true")
    return true
  return false
}

function getTestPort() {
  if (process.env.port)
    return process.env.port.trim().replaceAll('\"', '')
  return DEFAULT_PORT
}

function getTestPwmProtocol() {
  if (process.env.proto)
    return process.env.proto.trim().replaceAll('\"', '')
  return DEFAULT_PWM_PROTOCOL
}

function processData(_, chunk, type) {
  myLogger.info(`processData func start: type = ${type}`)
  if (type === 'close')
    gApp.serialIsClosed = true
  if (chunk) {
  if (type === 'data')
    myLogger.info(chunk.toString())
  } else if (type === 'open')
    myLogger.info(chunk)
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
  let portAvailable = await checkPortAvailable(FC_PORT_PATH)
  gApp.checkRebootPortAvaiable = 0
  while(portAvailable) {
    myLogger.info(`checkSerialHaveClosed ${FC_PORT_PATH} still available`)
    if (gApp.checkRebootPortAvaiable > maxWaitTimes) {
      myLogger.info(`Check ${FC_PORT_PATH} still available after exit command`)
      process.exit(-1)
      return
    }
    gApp.checkRebootPortAvaiable++
    await sleep(500)
    portAvailable = await checkPortAvailable(FC_PORT_PATH)
  }
}

async function checkFcHaveReboot(maxWaitTimes) {
  gApp.checkRebootTick = 0
  let portAvailable = await checkPortAvailable(FC_PORT_PATH)
  while(!portAvailable) {
    myLogger.info(`Check ${FC_PORT_PATH} non-available`)
    await sleep(500)
    gApp.checkRebootTick++
    if (gApp.checkRebootTick > maxWaitTimes) {
      myLogger.info(`Check ${FC_PORT_PATH} not reboot after exit command`)
      process.exit(-1)
      return
    }
    portAvailable = await checkPortAvailable(FC_PORT_PATH)
  }
  myLogger.info(`Check ${FC_PORT_PATH} available`)
}

// Allowed values: PWM, ONESHOT125, ONESHOT42, MULTISHOT, BRUSHED, DSHOT150, DSHOT300, DSHOT600, PROSHOT1000, DISABLED
async function setMotorPwmProtocol(protocol) {
  myLogger.info(`try set motor pwm protocol: ${protocol}`)
    await fcSerial.connect({
      path: FC_PORT_PATH,
      baudRate: 115200
    })
    gApp.serialIsClosed = false
    fcSerial.write('#\n')
    await sleep(1000)
    fcSerial.write(`set motor_pwm_protocol = ${protocol}\n`)
    await sleep(1000)
    fcSerial.write(`save\n`)
    await checkSerialHaveClosed(10)
    await sleep(1000)
    await checkFcHaveReboot(10)
}

async function tryReConnectPort(maxTryCnt) {
  gApp.checkCanConnect = 0
  while(gApp.checkCanConnect < maxTryCnt) {
    try {
      await fcSerial.connect({
        path: FC_PORT_PATH,
        baudRate: 115200
      })
      return
    } catch(err) {
      gApp.checkCanConnect++
      myLogger.error(`tryReConnectPort ${FC_PORT_PATH} error: ${ util.inspect(err) }`)
    }
  }
  throw new Error(`tryReConnectPort ${FC_PORT_PATH} failed`)
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
  if (!isDisSetProto())
    await setMotorPwmProtocol(PWM_PROTOCOL)
  while(true) {
    myLogger.info(`===============${gApp.testTimes}===============`)
    await tryReConnectPort(20)
    gApp.serialIsClosed = false
    fcSerial.write('#\n')
    await sleep(500)
    fcSerial.write(`exit\n`)
    await checkSerialHaveClosed(10)
    gApp.testTimes++
    await checkFcHaveReboot(10)
  }
}

start()
