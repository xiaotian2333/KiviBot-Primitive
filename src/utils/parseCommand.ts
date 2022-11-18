const parseCommand = (lineStr: string, nums = 123) => {
  const spaces = lineStr.match(/[^\S\n\r\t]+/g)?.length || 0
  nums = spaces > 0 ? nums || spaces + 1 : 0
  while (nums-- > 0) lineStr = lineStr.replace(/[^\S\n\r\t]+/, '__[br]__')
  const arr = lineStr.split('__[br]__')
  return { cmd: arr.shift() || lineStr, params: arr, nums: arr.length }
}

export default parseCommand
