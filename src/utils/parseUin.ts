export default function parseUin(qqLikeStr: string) {
  let qq = ''

  if (/^\{at:\d+\}$/.test(qqLikeStr)) {
    qq = /^\{at:(\d+)\}$/.exec(qqLikeStr)![1]
  } else if (/^\d+$/.test(qqLikeStr)) {
    qq = /^(\d+)$/.exec(qqLikeStr)![1]
  }

  return qq
}
