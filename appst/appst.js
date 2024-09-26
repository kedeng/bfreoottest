const util = require('util')
const {
  socketSendmsg,
  sendFcStUpdate
} = require('../socket/socketSend')
const {
  checkSerialsIsSame
} = require('../task/serialTask')
const fcSerial = require('../hardware/fcSerial')
const { serialProxy } = require('./serialProxy')
const { FC } = require('../fc/fc')

//  内部状态维护
class AppSt {
  constructor(_gApp) {
    this.gApp = _gApp
    this.fcPortIsConntected = false
    this.fcPortInfo = {
      path: '',
      baudRate: '115200'
    }
    this.serialPorts = []
    this.cronTask = {}
    this.fcSerial = fcSerial
    fcSerial.listen(this.serialListen.bind(this))
  }

  setCornTask(cortTaskOpt) {
    const {
      taskName,
      isRuning,
      task
    } = cortTaskOpt
    this.cronTask[taskName] = {
      isRuning,
      task
    }
  }

  setSerialPorts(ports) {
    const isSame = checkSerialsIsSame(this.serialPorts, ports)
    this.serialPorts = ports
    if (!isSame)
      this.sendAppStUpdateMsg()
  }

  sendAppStUpdateMsg() {
    sendFcStUpdate(this.gApp)
    /*
      const msgParams = this.getAppSt()
      // console.log(`send ${SOCKET_MSG_APPSTUPDATE} to room ${SOCKET_ROOM_APP}`)
      socketSendmsg({
        msgParams,
        socketIo: this.gApp.socketIo,
        roomName: SOCKET_ROOM_APP,
        msgName: SOCKET_MSG_APPSTUPDATE,
      })
    */
  }

  getAppSt() {
    return {
      fcPortIsConntected: this.fcPortIsConntected,
      fcPortInfo: this.fcPortInfo,
      serialPorts: this.serialPorts,
      fcInfo: JSON.parse(JSON.stringify(FC))
    }
  }

  serialListen(_, data, type) {
    const onOpenSerial = async () => {
      console.log(`appst onOpenSerial`)
      this.fcPortIsConntected = data.portIsOpened
      this.fcPortInfo = {
        path: data.path,
        baudRate: data.baudRate
      }
      FC.resetState()
      try {
        await serialProxy.procSerialOnOpen()
      } catch(err) {
       console.log(`appst onOpenSerial catch error: err.message`)
      }
      // console.log(`appst onOpenSerial before sendAppStUpdateMsg`)
      this.sendAppStUpdateMsg()
      // console.log(`appst onOpenSerial after sendAppStUpdateMsg`)
    }

    const onCloseSerial  = () => {
      this.fcPortIsConntected = false
      this.fcPortInfo = {
        path: '',
        baudRate: '115200'
      }
      FC.resetState()
      this.sendAppStUpdateMsg()
    }

    switch(type) {
      case 'data':
      break
      case 'open':
        onOpenSerial()
      break
      case 'close':
        onCloseSerial()
      break
    }
  }

}

module.exports = {
  AppSt
}
