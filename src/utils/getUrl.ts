export const getQQAvatarLink = (qq: number, size = 640) =>
  `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`

export const getGroupAvatarLink = (group: number, size = 640) =>
  `https://p.qlogo.cn/gh/${group}/${group}/${size}`
