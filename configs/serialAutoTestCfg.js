const testCfg = {
  pc_port_cfg: {
    usbPort: 'COM7',
    port0: 'COM16',
  },
  testSchemes: [
   {
     preRunCmds: [
       'serial 0 0 115200 57600 0 115200',
       'serial 2 1 115200 57600 0 115200',
     ],
     testPorts: [
       {
         pcPort: "port0",
         fcPortName: "串口3"
       }
     ]
   },
   {
     preRunCmds: [
       'serial 0 0 115200 57600 0 115200',
       'serial 2 1 115200 57600 0 115200',
     ],
     testPorts: [
       {
         pcPort: "port0",
         fcPortName: "串口xxx"
       }
     ]
   },
  ],
  // 测试失败后是否设置默认值
  errSetDefault: true,
  // 默认设置
  defaultSets: [
    'serial 0 131073 115200 57600 0 115200',
    'serial 1 64 115200 57600 0 115200',
    'serial 2 1 115200 57600 0 115200',
    'serial 3 0 115200 57600 0 115200',
    'serial 4 1024 115200 57600 0 115200',
    'serial 5 0 115200 57600 0 115200'
  ]
}

module.exports = {
  testCfg
}
