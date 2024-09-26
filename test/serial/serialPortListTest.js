const { SerialPort } = require('serialport')

/*
[
  {
    path: 'COM11',
    manufacturer: 'Microsoft',
    serialNumber: undefined,
    pnpId: 'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0002\\7&107EDF7B&0&48D8450B4214_C00000000',
    locationId: undefined,
    friendlyName: '蓝牙链接上的标准串行 (COM11)',
    vendorId: undefined,
    productId: undefined
  },
  {
    path: 'COM12',
    manufacturer: 'Microsoft',
    serialNumber: undefined,
    pnpId: 'BTHENUM\\{00001101-0000-1000-8000-00805F9B34FB}_LOCALMFG&0000\\7&107EDF7B&0&000000000000_00000000',
    locationId: undefined,
    friendlyName: '蓝牙链接上的标准串行 (COM12)',
    vendorId: undefined,
    productId: undefined
  },
  {
    path: 'COM5',
    manufacturer: 'STMicroelectronics.',
    serialNumber: '378234693133',
    pnpId: 'USB\\VID_0483&PID_5740\\378234693133',
    locationId: 'Port_#0007.Hub_#0002',
    friendlyName: 'STMicroelectronics Virtual COM Port (COM5)',
    vendorId: '0483',
    productId: '5740'
  }
]
*/
async function listPorts() {
  const serailPorts = await SerialPort.list()
  console.log(serailPorts)
  process.exit(0)
}

listPorts()
