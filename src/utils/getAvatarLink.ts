import { segment } from 'oicq'

import type { ImageElem } from 'oicq'

/** 通过 QQ 号获取任意头像链接或头像元素 */
export function getQQAvatarLink(qq: number, size: number, element: true): ImageElem
export function getQQAvatarLink(qq: number, size: number, element: false): string

export function getQQAvatarLink(qq: number, size = 640, element = false) {
  const link = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`

  if (element) {
    return segment.image(link)
  } else {
    return link
  }
}

/** 通过群号获取任意群头像链接或头像元素 */
export function getGroupAvatarLink(group: number, size: number, element: true): ImageElem
export function getGroupAvatarLink(group: number, size: number, element: false): string

export function getGroupAvatarLink(group: number, size = 640, element = false) {
  const link = `https://p.qlogo.cn/gh/${group}/${group}/${size}`

  if (element) {
    return segment.image(link)
  } else {
    return link
  }
}
