const util = require('util')
const MSP = require('./msp')
const { mspHelper } = require('./MSPHelper')

async function sendBathMspMsgs(opt) {
  const {
    /*
     {
       msp_code,
       msp_data,
     }
    */
    mspArr = [],
  } = opt
  const rt = []
  for( let i = 0; i < mspArr.length; i++) {
    const item = mspArr[i]
    const { code, data = false } = item
    console.log(`sendBathMspMsgs send code = ${ code }`)
    const mspRt = await MSP.promise(code, data)
    rt.push(mspRt)
  }
  return rt
}

function msgHelpFuncCall(opt) {
  const { funcName, funcArgs = [], callback } = opt
  const args = [...funcArgs, callback]
  if (!mspHelper[funcName])
    return callback(`${funcName} 不存在`)
  mspHelper[funcName](...args)
}

async function sendMspCrunchCall(opt) {
  const {
    crunchArr = [],
    callback,
    isWriteCfgReboot
  } = opt
  const rt = []
  try {
    for( let i = 0; i < crunchArr.length; i++) {
      const item = crunchArr[i]
      const { code, crunchArgs } = item
      console.log(`sendMspCrunchCall send code = ${ code }, crunchArgs = ${ util.inspect(crunchArgs) }`)
      const data = mspHelper.crunch(...crunchArgs)
      const mspRt = await MSP.promise(code, data)
      rt.push(mspRt)
    }
  } catch(err) {
    console.log(`sendMspCrunchCall catch error = ${ util.inspect(err) }`)
  }
  if (isWriteCfgReboot) {
    console.log(`sendMspCrunchCall isWriteCfgReboot = ${ isWriteCfgReboot }`)
    mspHelper.writeConfiguration(true)
  }
  callback(rt)
}

module.exports = {
  sendBathMspMsgs,
  msgHelpFuncCall,
  sendMspCrunchCall
}
