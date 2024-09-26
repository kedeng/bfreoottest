function deepSet(obj, path, value) {
  // 将路径字符串分割成数组
  const keys = path.split('.')
  // 遍历路径中的每一部分，直到最后一个属性
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    // 如果当前路径不存在，则创建一个空对象
    if (!current[key]) {
      current[key] = {}
    }
    current = current[key]
   }

   // 更新目标属性的值
   current[keys[keys.length - 1]] = value
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
  deepSet,
  sleep
}
