/*
 1. read test config file
 2. find fc port
 3. enter cli mode
 4. send test instruction
 4. wait until test complete
 6. exit cli mode
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
let replayCfg
try {
  replayCfg = require('./throttle_replay_config/replay_config.js')
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error(`模块未找到: throttle_replay_config/replay_config.js`);
  } else {
    console.error('加载模块replay_config.js时发生错误:', error)
  }
}

const MAX_THROTTLE_SIZE = 1024 * 5
const MAX_BATCH_SIZE = 256

function processData(_, chunk, type) {
  // myLogger.info(`--------------收到串口数据-------------------`)
  // myLogger.info(`processData func start: type = ${type}`)
  if (type === 'close')
    gApp.serialIsClosed = true
  if (chunk) {
    if (type === 'data') {
      if (chunk.toString().includes("complete")) {
        // myLogger.info(chunk.toString())
        gApp.isMotortcRunComplete = true
      } else if(chunk.toString().includes("setMotorVals")) {
        gApp.isMotortcSetComplete = true
      }
    }
  }
  // myLogger.info(`--------------------------------------------`)
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

// 处理油门值字符串
function parseMotorValStr(mstr) {
  const nstr = mstr.replaceAll(' ', '');
  const nstrArr = nstr.split(',')
  const rt = []
  for (let i = 0; i < nstrArr.length; i += MAX_THROTTLE_SIZE) {
    const groupedArr = nstrArr.slice(i, i + MAX_THROTTLE_SIZE)
    const subGroup = []
    for (let j = 0; j < groupedArr.length; j += MAX_BATCH_SIZE) {
      const groupedBatchArr = groupedArr.slice(j, j + MAX_BATCH_SIZE)
      subGroup.push([groupedBatchArr.join(',')])
    }
    rt.push(subGroup)
  }
  return rt
}

// 如果是空值，那么就返回默认值
function getMotorVals(mstr, defstrArr) {
  if (!mstr)
    return defstrArr
  return parseMotorValStr(mstr)
}

function parseReplayConfig() {
  const {
    throttle_delay_us = 1000,
    replay_times = 50,
    defmotor,
  } = replayCfg
  gApp.throttle_delay_us = throttle_delay_us
  gApp.replay_times = replay_times
  const defmotor_vals = parseMotorValStr(defmotor)
  const motor_vals = [];
  // 测试批次
  let throttle_batch = 1
  for(let i = 0; i < 4; i++)  {
    motor_vals.push(getMotorVals(replayCfg[`motor${i}`], defmotor_vals))
    if (motor_vals[i].length > throttle_batch)
      throttle_batch = motor_vals[i].length
  }
  gApp.motor_vals = motor_vals
  gApp.throttle_batch = throttle_batch
  console.log(util.inspect(motor_vals, null, 10))
  consoleTip(`重复次数为${replay_times}，每次测试批数为${throttle_batch}，油门间发送时间间隔为${throttle_delay_us}微秒`)
}

async function sendCliToFc(fcPort) {
  await fcSerial.connect({
    path: fcPort,
    baudRate: 115200
  })
  gApp.serialIsClosed = false
  fcSerial.write('#\n')
  await sleep(1000)
}

async function checkMotorunComplete() {
  // 2天超时
  const MAX_MOTOR_RUNCP_CHK = 60 * 60 * 24 * 2
  gApp.checkMotorRunCplTick = 0
  while(!gApp.isMotortcRunComplete) {
    console.log('.')
    await sleep(1000)
    gApp.checkMotorRunCplTick++
    if (gApp.checkMotorRunCplTick > MAX_MOTOR_RUNCP_CHK) {
      consoleError(`等待执行完成超时`)
      process.exit(-1)
      return
    }
  }
}

// 检测设置成功
async function checkMotorSetComplete() {
  const MAX_MOTOR_SET_CHK = 20
  gApp.checkMotorSetTick = 0
  while(!gApp.isMotortcSetComplete) {
    console.log('*')
    await sleep(1000)
    gApp.checkMotorSetTick++
    if (gApp.checkMotorSetTick > MAX_MOTOR_SET_CHK) {
      consoleError(`等待设置完成超时`)
      process.exit(-1)
      return
    }
  }
}

async function throttleReplayTestExcute(batch) {
  const { motor_vals, throttle_delay_us, throttle_batch } = gApp
  if (gApp.isSetThrottle !== true || throttle_batch > 1 ) {
    for(let i = 0; i < 4; i++) {
      let setStrArr = []
      let items = motor_vals[i]
      if (items.length > batch)
        setStrArr = items[batch]
      fcSerial.write(`motortcclr ${i}\n`)
      await sleep(100)
      // consoleTip(`motor${i}的值为: ${setStr}`)
      for(let j = 0; j < setStrArr.length; j++) {
        const setStr = setStrArr[j]
        if (setStr && setStr.length) {
          gApp.isMotortcSetComplete = false
          const clistr = `motortcset ${i} ${j} ${setStr}\n`
          console.log(clistr)
          fcSerial.write(clistr)
          await checkMotorSetComplete()
        }
      }
    }
  }
  gApp.isMotortcRunComplete = false
  gApp.isSetThrottle = true
  // console.log(`before run: batch = ${batch}`)
  fcSerial.write(`motortcrun ${throttle_delay_us}\n`)
  await checkMotorunComplete()
  // console.log(`complete run: batch = ${batch}`)
}

// 开始执行油门重放测试
async function throttleReplayTest() {
  const { replay_times, throttle_batch } = gApp
  gApp.isSetThrottle = false
  try {
    for(let i = 0; i < replay_times; i++) {
      consoleRainbow(`--------------------开始第${i}轮测试--------------------`)
      for(let j = 0; j < throttle_batch; j++)
        await throttleReplayTestExcute(j)
    }
  } catch(err) {
    consoleError(`throttleReplayTest 测试异常: ${err.message}`)
  }
}

async function start() {
  myLogger.info(`油门重放测试开始`)
  // 开如解析配置文件
  parseReplayConfig()
  fcSerial.setGApp(gApp)
  fcSerial.listen(processData)
  consoleTip(`请将飞控插入USB, 开始检测飞控端口.`)
  const fcPortPath = await checkFcUsbAvaialbe()
  await sendCliToFc(fcPortPath)
  await throttleReplayTest()
  fcSerial.write(`exit\n`)
  await sleep(1000)
  await checkSerialHaveClosed(fcPortPath, 10)
  consoleRainbow(`================================`)
  consoleRainbow(`测试结束`)
  consoleRainbow(`================================`)
}

start()
