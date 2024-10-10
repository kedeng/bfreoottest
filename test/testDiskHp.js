const { getRemoveableDiskName } = require('../common/diskHp')

async function main() {
 const diskInfos = await getRemoveableDiskName()
 console.log(diskInfos)
}

main()
