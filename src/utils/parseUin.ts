/** 解析 qq，支持艾特，可以是 `1141284758` 或者是 `{at:1141284758}` */
export function parseUin(qqLikeStr: string) {
  let qq = 0

  if (/^\{at:\d+\}$/.test(qqLikeStr)) {
    qq = Number(/^\{at:(\d+)\}$/.exec(qqLikeStr)![1])
  } else if (/^\d+$/.test(qqLikeStr)) {
    qq = Number(/^(\d+)$/.exec(qqLikeStr)![1])
  }

  return qq
}
