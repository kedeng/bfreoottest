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

