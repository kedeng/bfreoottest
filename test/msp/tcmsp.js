const util = require('util')
const fcSerial = require('../../hardware/fcSerial')
const {
  myLogger,
  gApp
} = require('../testHp')
const { serialProxy } = require('../../appst/serialProxy')
const MSPCodes = require('../../msp/MSPCodes')
const MSP = require('../../msp/msp')
const { FC } = require('../../fc/fc')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  try {
    fcSerial.setGApp(gApp)
    const rt = await fcSerial.connect({
      path: 'COM5',
      baudRate: 115200
    })
    console.log(`rt = ${rt}`)
    const result = await MSP.promise(MSPCodes.MSP_API_VERSION, false)
    console.log(`result = ${util.inspect(result)}`)
  } catch(err) {
    console.log(`test catch error: ${err.message}`)
  }
}

start()

