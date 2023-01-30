import { segment } from 'oicq'

/** 通过 QQ 号获取任意头像链接 */
export function getQQAvatarLink(qq: number, size = 640, element = false) {
  const link = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`
  return element ? segment.image(link) : link
}

/** 通过群号获取任意群头像链接 */
export function getGroupAvatarLink(group: number, size = 640, element = false) {
  const link = `https://p.qlogo.cn/gh/${group}/${group}/${size}`
  return element ? segment.image(link) : link
}
