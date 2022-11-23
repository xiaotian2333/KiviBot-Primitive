export default function parseUin(qqLikeStr: string) {
  let qq = 0

  if (/^\{at:\d+\}$/.test(qqLikeStr)) {
    qq = Number(/^\{at:(\d+)\}$/.exec(qqLikeStr)![1])
  } else if (/^\d+$/.test(qqLikeStr)) {
    qq = Number(/^(\d+)$/.exec(qqLikeStr)![1])
  }

  return qq
}
