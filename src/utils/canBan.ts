import type { Client } from 'oicq'

/** 判断 Bot 是否有权限或者是否能够禁言目标群的目标 qq  */
export async function canBan(this: Client, gid: number, qq: number) {
  if (qq === this.uin) {
    // 目标 qq 是自身时无法禁言
    return false
  }

  try {
    // 严格模式，目标群号不在目标群会抛出异常
    const group = this.pickGroup(gid, true)

    const botIsOwner = group.is_owner
    const botIsAdmin = group.is_admin

    // 严格模式，目标 qq 不在目标群会抛出异常
    const member = group.pickMember(qq, true)

    const targetIsMember = !member.is_admin && !member.is_owner

    // Bot 是群主，或者 Bot 是群管理员但目标 qq 只是普通群员时 可以禁言
    return botIsOwner || (botIsAdmin && targetIsMember)
  } catch {
    // 目标群不存在或者目标 qq 不在目标群返回 false
    return false
  }
}
