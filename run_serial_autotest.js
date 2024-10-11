const util = require('util')
const fcSerial = require('./hardware/fcSerial')
const FcSerial = require('./hardware/fcSerialClass')
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
const schemeCfg = require('./configs/serialAutoTestCfg')
const CLI_CMD_WAIT_SLEEP = 200

function getConfgScheme() {
  const cfgName = process.env.cfg
  if (!cfgName)
    throw new Error(`请在环境变量中设置cfg`)
  const cfgData = schemeCfg[cfgName.trim()]
  if (!cfgData)
    throw new Error(`没有找到${cfgName}对应的配置数据`)
  return cfgData
}

async function ensurePortIsOpened(pName) {
  const MAX_WAIT_PORT_OPEN_TICKS = 10
  const portPath = gApp.cfgData.pc_port_cfg[pName]
  if (!portPath)
      throw new Error(`${pName}配置不存在`)
  if (!gApp[`s_${pName}`].portIsOpened) {
    const copt = {
      path: portPath
    }
    console.log(`尝试连接${pName}`)
    gApp[`s_${pName}`].connect(copt)
    let waitIndex = 0
    while(waitIndex < MAX_WAIT_PORT_OPEN_TICKS) {
      if (gApp[`s_${pName}`].portIsOpened)
        return
      await sleep(1000)
      console.log('........')
      waitIndex++
    }
    throw new Error(`${portPath}连接失败`)
  }
}

// 确保usbvcp已连接
async function ensureUsbVcpOpend() {
  await ensurePortIsOpened('usbPort')
}

async function restoreDefaultCfgs() {
  const { defaultSets } = gApp.cfgData
  if (defaultSets && defaultSets.length) {
    console.log(`尝试恢复默认配置`)
    await ensureUsbVcpOpend()
    gApp.s_usbPort.write('#\n')
    await sleep(CLI_CMD_WAIT_SLEEP)
    for(let i=0; i < defaultSets.length; i++) {
      const curItem = defaultSets[i]
      gApp.s_usbPort.write(`${curItem}\n`)
      await sleep(CLI_CMD_WAIT_SLEEP)
    }
    gApp.s_usbPort.write('save\n')
    await sleep(CLI_CMD_WAIT_SLEEP)
  }
  consoleTip(`默认配置已保存`)
}

async function checkAndRestoreDef() {
  if (gApp.cfgData.errSetDefault) {
    await restoreDefaultCfgs()
  }
}

function processData(portName, _, chunk, type) {
  if (type === 'close' && portName === 'usbPort')
    gApp.usbSerialIsClosed = true
  if (type === 'open' && portName === 'usbPort')
    gApp.usbSerialIsClosed = false
  if (chunk) {
    if (type === 'data')
      console.log(`${chunk.toString()}`)
  }
}


// 初始化电脑侧端口
function initPortsCfg() {
  const pcPortCfg = gApp.cfgData.pc_port_cfg
  for (const key of Object.keys(pcPortCfg)) {
    gApp[`s_${key}`] = new FcSerial()
    gApp[`s_${key}`].setGApp(gApp)
    gApp[`s_${key}`].listen(
      (...args) => {
        args.unshift(`${key}`)
        processData(...args)
      }
    )
  }
}

// 确认usbvcp端口是否已打开
async function checkUsbVcpPortAvailable() {
  const usbvcpPort = gApp.cfgData.pc_port_cfg.usbPort
  return await checkPortAvailable(usbvcpPort)
}

async function checkFcUsbAvaialbe(maxWait=50) {
  const redectSecs = 1
  let curWaitTick = 0
  while(true) {
    const isAvailable = await checkUsbVcpPortAvailable()
    if (isAvailable) {
      console.log(`检测到飞控连接`)
      return
    }
    console.log(`没有发现飞控连接(${gApp.cfgData.pc_port_cfg.usbPort})，\
${redectSecs}秒后重试。`)
    await sleep(1000 * redectSecs)
    curWaitTick++
    if (curWaitTick > maxWait) {
      throw new Error(`长时间没有检测到飞控连接`)
    }
  }
}

// 单个端口测试代码
async function beginTestPort(pcPort, fcPortName) {
  await ensurePortIsOpened(pcPort)
  gApp.isTestSuccss = false
  gApp[`s_${pcPort}`].listen(
    (_, chunk, type) => {
      if (chunk) {
        if (type === 'data') {
          gApp.isTestSuccss = true
        }
      }
    }
  )
  gApp[`s_${pcPort}`].write('#\n')
  const MAX_CHECK = 4
  let curCheckTick = 0
  while(curCheckTick < MAX_CHECK) {
    if (gApp.isTestSuccss)
      return
    await sleep(1000)
    curCheckTick++
    console.log(`正在等待${pcPort}收到响应`)
  }
  if (!gApp.isTestSuccss) {
    throw new Error(`测试失败未收到响应`)
  }
}

// 真正测试串口的代码在这里
async function startTestPorts(testPorts) {
  for(let i = 0; i < testPorts.length; i++) {
    const itPort = testPorts[i]
    const { pcPort, fcPortName } = itPort
    consoleTip(`----------------`)
    consoleTip(`开始测试${fcPortName}`)
    await beginTestPort(pcPort, fcPortName)
    consoleTip(`测试${fcPortName}成功`)
    consoleTip(`----------------`)
    gApp[`s_${pcPort}`].write('exit\n')
    await sleep(1000)
    consoleTip(`等待飞控重启`)
    await checkFcPortHaveClosed(10)
    await checkFcUsbAvaialbe(20)
  }
}

async function checkFcPortHaveClosed(maxCheckCnt) {
  let checkCnt = 0
  while(checkCnt < maxCheckCnt) {
    if (gApp.usbSerialIsClosed)
      return
    await sleep(1000)
    checkCnt++
  }
  throw new Error(`没有检测到FC重启`)
}

// 开始测试哪一组
async function startTestScheme(schemeCfg) {
  const {
    totalTestRounds,
    curTestRound
  } = gApp
  consoleTip(`开始测试第${curTestRound}组，总共${totalTestRounds}组。`)
  try {
    const {
      preRunCmds,
      testPorts
    } = schemeCfg
    console.log(`开如执行以下命令:`)
    console.log(preRunCmds)
    await ensureUsbVcpOpend()
    gApp.s_usbPort.write('#\n')
    await sleep(CLI_CMD_WAIT_SLEEP)
    for(let i=0; i < preRunCmds.length; i++) {
      const curItem = preRunCmds[i]
      gApp.s_usbPort.write(`${curItem}\n`)
      await sleep(CLI_CMD_WAIT_SLEEP)
    }
    gApp.s_usbPort.write('save\n')
    await sleep(CLI_CMD_WAIT_SLEEP)
    await checkFcPortHaveClosed(10)
    consoleTip(`等待飞控重启`)
    await checkFcUsbAvaialbe(20)
    // 重启后就可以开测试了
    await startTestPorts(testPorts)
    consoleTip(`第${curTestRound}组测试完成`)
    // =====================
  } catch(err) {
    consoleError(`第${curTestRound}组测试出错:${err.message}`)
    await checkAndRestoreDef()
    consoleError(`!!!!!!!!!!!!!!!!!!!!!!!`)
    consoleError(`!!!!!!测试失败!!!!!!`)
    consoleError(`!!!!!!!!!!!!!!!!!!!!!!!`)
    process.exit(-1)
  }
}

// 开始测试所有测试方案
async function testAllScheme() {
  const testSchemes = gApp.cfgData.testSchemes
  gApp.totalTestRounds = testSchemes.length
  for(let i=0; i<testSchemes.length; i++) {
    const scheme = testSchemes[i]
    gApp.curTestRound = i + 1
    await startTestScheme(scheme)
  }
}

async function startTestCfgData() {
  try {
    await checkFcUsbAvaialbe()
    initPortsCfg()
    await testAllScheme()
    await restoreDefaultCfgs()
    await consoleRainbow(`======================`)
    await consoleRainbow(`==========测试成功===========`)
    await consoleRainbow(`======================`)
  } catch(err) {
    consoleError(`测试出错: ${err.message}`)
    await checkAndRestoreDef()
  }
}

async function start() {
  const cfgData = getConfgScheme()
  consoleTip(`开始测试, 当前测试配置是:`)
  consoleTip(cfgData)
  gApp.cfgData = cfgData
  await startTestCfgData(cfgData)
  process.exit(0)
}

start()
