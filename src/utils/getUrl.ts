/** 通过 QQ 号获取头像链接 */
export function getQQAvatarLink(qq: number, size = 640) {
  return `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`
}

/** 通过群号获取群头像链接 */
export function getGroupAvatarLink(group: number, size = 640) {
  return `https://p.qlogo.cn/gh/${group}/${group}/${size}`
}
