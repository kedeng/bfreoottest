const util = require('util')
const { SerialPortMock, SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const DEF_BAUDRATE = 115200

class FcSerial {
  constructor() {
    this.path = ''
    this.baudRate = DEF_BAUDRATE
    this.port = null
    this.portIsOpened = false
    this.listeners = []
  }

  setGApp(_gApp) {
    this.gApp = _gApp
    this.myLogger = _gApp.myLogger
  }

  async connect(opt) {
    const {
      path,
      baudRate
    } = opt
    return new Promise(
      (resolve, reject) => {
        // SerialPortMock.binding.createPort(path)
        this.port = new SerialPort({ path, baudRate, autoOpen: false })
        this.connectionId = path
        this.path = path
        this.baudRate = baudRate
        const parser = new ReadlineParser()
        this.port.pipe(parser)
        this.port.open((err) => {
          if (err) {
            this.myLogger.error(`FcSerial open ${path} ${baudRate} failed: ${ util.inspect(err.message) }`)
            return reject(err)
          }
          this.myLogger.info(`FcSerial open ${path} ${baudRate} successed`)
          return resolve(true)
        })
        this.port.on('open', this.onPortOpen.bind(this))
        this.port.on('error', this.onPortError.bind(this))
        this.port.on('close', this.onPortClose.bind(this))
        this.port.on('readable', this.onPortData.bind(this))
      }
    )
  }

  onPortOpen() {
    console.log(`FcSerial on Open`)
    this.portIsOpened = true
    this.notify({
      portIsOpened: this.portIsOpened,
      path: this.path,
      baudRate: this.baudRate
    }, 'open')
  }

  resetPortSt() {
    this.portIsOpened = false
    this.port = null
    this.path = ''
    this.baudRate = DEF_BAUDRATE
  }

  onPortClose() {
    console.log(`FcSerial on close`)
    this.resetPortSt()
    this.notify(null, 'close')
    // this.clearListeners()
  }

  onPortData() {
    const chunk = this.port.read()
    if (chunk)
      this.notify(chunk, 'data')
  }

  onPortError(err) {
    this.myLogger.error(`FcSerial on error: ${ util.inspect(err) }`)
  }

  notify(chunk, type) {
    this.listeners.forEach((listener) => {
      listener(this, chunk, type)
    })
  }

  listen(listener) {
    if (this.listeners.indexOf(listener) == -1) {
      this.listeners.push(listener)
    }
  }

  clearListeners() {
    this.listeners = [];
  }

  send(data, cb) {
    if (data instanceof ArrayBuffer) {
      const bufferData = Buffer.from(data)
      this.write(bufferData, cb)
      return
    }
    this.write(data, cb)
  }

  write(data, cb) {
    if (!this.portIsOpened || !this.port) {
      this.myLogger.error(`FcSerial write data error: port doesn't opened`)
      return
    }
    this.port.write(data)
    if (cb)
      this.port.drain(cb)
  }

  drain(cb) {
    this.port.drain(cb)
  }

  close(cb) {
    if (this.port)
      this.port.close(cb)
    else cb(null)
  }

}

const fcSerial = new FcSerial()

module.exports = fcSerial
