const fcSerial = require('../../hardware/fcSerial')
const {
  myLogger,
  gApp
} = require('../testHp')

const processData = (_, chunk, type) => {
  console.log(`processData func start: type = ${type}`)
  if (chunk)
    console.log(chunk.toString())
  console.log(`processData func end`)
}

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
    fcSerial.listen(processData)
    fcSerial.write('#\n')
    await sleep(1000)
    fcSerial.write(`help\n`)
    await sleep(1000)
    fcSerial.write('dump\n')
    await sleep(1000)
    fcSerial.close(err => {
      if (err)
        console.log(`close port error: ${err.message}`)
    })
  } catch(err) {
    console.log(`test catch error: ${err.message}`)
  }
}

start()
