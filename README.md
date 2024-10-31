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


## run_throttle_replay.js

油门重放测试工具，测试前请先将“油门重放固件”目录下的飞控固件烧录在飞控板上。

### 测试原理

“油门重放固件”增加了3条油门测试指令：

#### motortcset 指令

motortcset用于向某个电机配置油门值数组，指令格式为： motortcset <电机索引> <油门值字符串>

<电机索引>值范围为0-3, 分别表示1号到4号电机。

<油门值字符串>以逗号（,）进行分隔，每个值表示DShot油门值(47 - 2000)。例如：200,100,290 分别表示三个油门值[200, 100, 290]。油门值数组最大为1024。

以下指令表示向4号电机配置油门值100,200,300。

```
motortcset 3 100,200,300
```

#### motortcget 指令

motortcget用于查询某个电机在特定索引下的油门值，主要用于测试motortcset是否正确设置值。

指令格式： motortcget <电机索引> <油门索引>

以下指令获取4号电机油门数组中索引为0的值。

```
motortcget 3 0
```

#### motortcrun 指令
motortcrun用于依次执行油门数组设置的值。

指令格式：motortcrun <延迟微秒值>

以下指令用于运行油门数组，每个油门测试时间为1000微秒。

```
motortcrun 1000
```

#### motortcclr 指令
motortcclr用于清空油门数组，多次测试时需要。

指令格式：motortcclr <电机索引>

以下指令用于清除电机2的油门数组

```
motortcclr 1
```

### 执行测试脚本
在throttle_replay_config目录下创建配置文件replay_config.js文件（参考replay_config.示例.js）

```
node run_throttle_replay.js
```
