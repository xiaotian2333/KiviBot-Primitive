export const gray = colorful(90)
export const red = colorful(31)
export const green = colorful(32)
export const yellow = colorful(33)
export const blue = colorful(34)
export const magenta = colorful(35)
export const cyan = colorful(36)
export const white = colorful(37)

export default { gray, red, green, yellow, blue, magenta, cyan, white }

/**
 * 控制台彩色字体
 *
 * @param {number} code - ANSI escape code
 */
function colorful(code: number) {
  return (msg: string) => `\u001b[${code}m${msg}\u001b[0m`
}
