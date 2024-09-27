# Test scripts for betaflight

Run `npm install` before test.

## run_cli_loop_exit.js

This script will set motor protocol to PWM and continuously restart FC.

Run in windows, please change COM7 to your FC port:

```
set port=COM7 & node run_cli_loop_exit.js
```