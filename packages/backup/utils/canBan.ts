import type { Client } from 'movo'

/** 判断 Bot 是否有权限或者是否能够禁言目标群的目标 qq  */
export async function canBan(this: Client, gid: number, qq: number) {
  if (qq === this.uin) {
    // 目标 qq 是自身时无法禁言
    return false
  }

  if (!this.gl.has(gid)) {
    // 目标群不存在或者目标 qq 不在目标群返回 false
    return false
  }

  const g = this.pickGroup(gid, true)

  const botIsOwner = g.is_owner
  const botIsAdmin = g.is_admin

  // 严格模式，目标 qq 不在目标群会抛出异常
  const member = g.pickMember(qq, true)

  // 仅为普通群员（不是群主和管理员）
  const targetIsMember = !member.is_admin && !member.is_owner

  // Bot 是群主，或者 Bot 是群管理员但目标 qq 只是普通群员时 可以禁言
  return botIsOwner || (botIsAdmin && targetIsMember)
}