const { exec } = require('child_process')
const { consoleError } = require('./colorTip')
const iconv = require('iconv-lite')

function getDiskNameThrRemoveDisk(wmistr) {
  const lines = wmistr.trim().split('\n')
  const drives = []
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/) // 按空白字符分割
    if (parts.length >= 3) {
        const drive = {
          DriveType: parts[0],
          FileSystem: parts[1],
          Name: parts[2],
          VolumeName: parts[3] || '' // 处理可能为空的 VolumeName
        };
        if (drive.DriveType === '2')
          drives.push(drive)
      }
  })
  return drives
}

async function getRemoveableDiskName() {
  const execCmd = `wmic logicaldisk get name, drivetype, filesystem, volumename`
  return new Promise(
    (resolve, reject) => {
      exec(execCmd, (error, stdout, stderr) => {
        if (error) {
          consoleError(`wmic: 执行出错: ${error.message}`)
          return reject(error)
        }
        if (stderr) {
          consoleError(`wmic: 标准错误: ${stderr}`)
        }
        console.log(`磁盘信息:\n${stdout}`)
        const diskInfos = getDiskNameThrRemoveDisk(stdout)
        return resolve(diskInfos)
      })
    }
  )
}

async function formatRemoveableDisk(driverName, fs="FAT") {
  const execCmd = `format ${driverName} /FS:${fs} /Q /Y`
  return new Promise(
    (resolve, reject) => {
      exec(execCmd, { encoding: 'binary' }, (error, stdout, stderr) => {
        if (error) {
          consoleError(`格式化${driverName}出错: ${error.message}`)
          return reject(error)
        }
        if (stderr) {
          consoleError(`format标准错误: {iconv.decode(stderr, 'cp936')}`)
        }
        console.log(`format输出:\n${iconv.decode(stdout, 'cp936')}`)
        return resolve()
      })
    }
  )
}

module.exports = {
  getRemoveableDiskName,
  getDiskNameThrRemoveDisk,
  formatRemoveableDisk
}
