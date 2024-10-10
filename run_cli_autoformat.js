/*
 1. find fc port
 2. enter cli mode
 3. send 'msc'
 4. wait until get movealbe disk appear
 5. format the disk
 6. goto step 1
 */

const util = require('util')
const fcSerial = require('./hardware/fcSerial')
const {
  checkPortAvailable,
  findStmFcPort
} = require('./hardware/serialHp')
const { myLogger, gApp } = require('./test/testHp')
const { sleep } = require('./utils/support')
const {
  consoleTip,
  consoleError,
  consoleSuccess,
  consoleRainbow
} = require('./common/colorTip')
const {
  getRemoveableDiskName,
  formatRemoveableDisk
} = require('./common/diskHp')

function processData(_, chunk, type) {
  myLogger.info(`--------------收到串口数据-------------------`)
  myLogger.info(`processData func start: type = ${type}`)
  if (type === 'close')
    gApp.serialIsClosed = true
  if (chunk) {
  if (type === 'data')
    myLogger.info(chunk.toString())
  } else if (type === 'open')
    myLogger.info(chunk)
  myLogger.info(`--------------------------------------------`)
}

async function checkFcUsbAvaialbe() {
  const redectSecs = 5
  while(true) {
    const fcPortPath = await findStmFcPort()
    if (fcPortPath) {
      myLogger.info(`找到飞控端口${fcPortPath}`)
      return fcPortPath
    }
    console.log(`没有发现飞控连接，${redectSecs}秒后重试。`)
    await sleep(1000 * redectSecs)
  }
}

async function checkSerialHaveClosed(fcPort, maxWaitTimes) {
  gApp.checkCloseTick = 0
  while(!gApp.serialIsClosed) {
    console.log(`等待飞控重启，第${gApp.checkCloseTick + 1}次`)
    await sleep(1000)
    gApp.checkCloseTick++
    if (gApp.checkCloseTick > maxWaitTimes) {
      consoleError(`等待飞控重启超时`)
      process.exit(-1)
      return
    }
  }
  let portAvailable = await checkPortAvailable(fcPort)
  gApp.checkRebootPortAvaiable = 0
  while(portAvailable) {
    console.log(`检测飞控串口，第${gApp.checkRebootPortAvaiable + 1}次`)
    if (gApp.checkRebootPortAvaiable > maxWaitTimes) {
      consoleError(`检测飞控重启超时`)
      process.exit(-1)
      return
    }
    gApp.checkRebootPortAvaiable++
    await sleep(1000)
    portAvailable = await checkPortAvailable(fcPort)
  }
}

async function waitRemoveableDiskAppear(maxWaitTimes) {
  gApp.checDiskAppearTick = 0
  let rdisks= await getRemoveableDiskName()
  if (rdisks.length)
    return rdisks
  while(true) {
    console.log(`等待可移动磁盘出现，第${gApp.checDiskAppearTick + 1}次`)
    await sleep(1000)
    gApp.checDiskAppearTick++
    if (gApp.checDiskAppearTick > maxWaitTimes) {
      consoleError(`等待可移动磁盘出现超时`)
      process.exit(-1)
      return
    }
    rdisks = await getRemoveableDiskName()
    if (rdisks.length)
      return rdisks
  }
}

async function sendCliMscToFc(fcPort) {
  await fcSerial.connect({
    path: fcPort,
    baudRate: 115200
  })
  gApp.serialIsClosed = false
  fcSerial.write('#\n')
  await sleep(1000)
  fcSerial.write(`msc\n`)
  await sleep(1000)
  await checkSerialHaveClosed(fcPort, 10)
}

async function start() {
  let testIndex = 1
  myLogger.info(`自动格式化程序开始`)
  fcSerial.setGApp(gApp)
  fcSerial.listen(processData)
  while(true) {
    consoleTip(`--${testIndex}-- 请将飞控插入USB, 开始检测飞控端口.`)
    const fcPortPath = await checkFcUsbAvaialbe()
    await sendCliMscToFc(fcPortPath)
    const removeableDisks = await waitRemoveableDiskAppear(20)
    if (removeableDisks.length > 2) {
      consoleError(`检测到有${removeableDisks.length}个移动磁盘，请只保留需要格式化的磁盘`)
      process.exit(-1)
    }
    const { Name, FileSystem } = removeableDisks[0]
    myLogger.info(`开始格式化${Name}-${FileSystem}`)
    await formatRemoveableDisk(Name)
    myLogger.info(`格式化${Name}-${FileSystem}完成`)
    consoleRainbow(`================================`)
    consoleRainbow(`格式化${Name}-${FileSystem}成功`)
    consoleRainbow(`================================`)
    console.log(`--${testIndex}-- 操作结束,请移除飞控板`)
    await sleep(1000)
    testIndex++
  }
}

start()
