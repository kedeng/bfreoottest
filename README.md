# Test scripts for betaflight

Run `npm install` before test.

## run_cli_loop_exit.js

This script will set motor protocol and continuously restart FC.

Run in windows, please change COM7 to your FC port:

```
set port=COM7 && set proto=PWM && set disSetProto=false && node run_cli_loop_exit.js
```

proto: PWM, ONESHOT125, ONESHOT42, MULTISHOT, BRUSHED, DSHOT150, DSHOT300, DSHOT600, PROSHOT1000, DISABLED


Not set motor protocol:
```
set port=COM7 & set disSetProto=true & node run_cli_loop_exit.js
```

## run_cli_autoformat.js

This script will auto find FC and open msc, then try to format it.

```
node run_cli_autoformat.js
```


## run_serail_autotest.js

串口自动测试工具

```
set cfg=testCfg && node run_serial_autotest.js
```
