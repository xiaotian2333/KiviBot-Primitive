/** 浅灰色前景（默认背景） */
export const gray = colorful(90)
/** 红色前景（默认背景） */
export const red = colorful(31)
/** 绿色前景（默认背景） */
export const green = colorful(32)
/** 黄色前景（默认背景） */
export const yellow = colorful(33)
/** 蓝色前景（默认背景） */
export const blue = colorful(34)
/** 紫色前景（默认背景） */
export const magenta = colorful(35)
/** 青色前景（默认背景） */
export const cyan = colorful(36)
/** 白色前景（默认背景） */
export const white = colorful(37)

/** 控制台彩色字体 */
export default { gray, red, green, yellow, blue, magenta, cyan, white }

/**
 * 控制台彩色字体
 *
 * @param {number} code - ANSI escape code
 */
function colorful(code: number) {
  return (msg: string) => `\u001b[${code}m${msg}\u001b[0m`
}
