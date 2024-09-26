const util = require('util')
const MSP = require('../msp/msp')
const MSPCodes = require('../msp/MSPCodes')
const { FC } = require('../fc/fc')
const { mspHelper } = require('../msp/MSPHelper')
const fcSerial = require('../hardware/fcSerial')
const { Features } = require('../fc/Features')

class SerialProxy {
  constructor() {
    this.fcSerial = fcSerial
    // msp、cli
    this.serialType = 'MSP'
    this.serialDataProcAdapt = null
    this.configDataProcAdapt()
    fcSerial.listen(this.serailListen.bind(this))
    MSP.listen(mspHelper.process_data.bind(mspHelper))
  }

  configDataProcAdapt() {
    if (this.serialType == 'MSP') {
      this.serialDataProcAdapt = this.serailProcMsgData
    }
  }

  serailProcMsgData(data) {
    // console.log(`serailProcMsgData data = ${ util.inspect(data) }`)
    MSP.read(data)
  }

  async procSerialOnOpen() {
    console.log(`SerialProxy mspListen on open`)
    await MSP.promise(MSPCodes.MSP_API_VERSION, false)
    console.log(`procSerialOnOpen func: FC.CONFIG.apiVersion = ${FC.CONFIG.apiVersion}`)
    if (FC.CONFIG.apiVersion.includes('null')) {
      console.log(`FC.CONFIG.apiVersion.includes null`)
    }
    await MSP.promise(MSPCodes.MSP_FC_VERSION, false)
    if (FC.CONFIG.flightControllerVersion !== '') {
      FC.FEATURE_CONFIG.features = new Features(FC.CONFIG)
    }
    await MSP.promise(MSPCodes.MSP_STATUS, false)
  }

  serailListen(_, data, type) {
    const _procData = () => {
      console.log(`SerialProxy mspListen on data`)
      this.serialDataProcAdapt(data)
    }
    switch(type) {
      case 'data':
        _procData()
      break
      default:
      break
    }
  }
}

const serialProxy = new SerialProxy()

module.exports = {
  serialProxy
}
