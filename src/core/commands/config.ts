import { kiviConf, saveKiviConf } from '@/config'
import { parseUin } from '@src/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigText = `
〓 KiviBot Config 〓
/config detail
/config admin add/rm <qq>
/config notice on/off
/config friend <operation>
/config group <operation>
`.trim()

export async function handleConfigCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    await reply(ConfigText)
  }

  const [secondCmd, thirdCmd, value] = params

  if (secondCmd === 'detail') {
    const { friend } = kiviConf.notice

    const subAdmins = kiviConf.admins.slice(1)

    const detail = `
〓 KiviBot Config Detail 〓
login mode: ${kiviConf.login_mode ?? 'null'}
device mode: ${kiviConf.device_mode ?? 'null'}
main admin: ${kiviConf.admins[0] ?? 'null'}
sub admins: ${subAdmins.length ? subAdmins.join(', ') : 'empty'}
notice status: ${kiviConf.notice.enable ? 'on' : 'ff'}
friend operation: ${friend.request.action ?? 'null'}
group operation: ${friend.request.action ?? 'null'}
`.trim()

    return reply(detail)
  }

  const mainAdmin = kiviConf.admins[0]

  if (secondCmd === 'admin') {
    const qq = parseUin(value)

    if (!qq) {
      return reply('〓 qq is required 〓')
    } else {
      const set = new Set(kiviConf.admins.splice(1))

      if (thirdCmd === 'add') {
        if (set.has(qq) || qq === mainAdmin) {
          return reply('〓 is already admin 〓')
        }

        set.add(qq)

        kiviConf.admins = [mainAdmin, ...set]

        if (saveKiviConf()) {
          bot.emit('kivi.admin', { admins: [...kiviConf.admins] })
          return reply('〓 done 〓')
        }
      } else if (thirdCmd === 'rm') {
        if (qq === mainAdmin) {
          return reply('〓 cannot remove mainAdmin 〓')
        }

        if (!set.has(qq)) {
          return reply('〓 is not admin 〓')
        }
        set.delete(qq)

        kiviConf.admins = [mainAdmin, ...set]

        if (saveKiviConf()) {
          bot.emit('kivi.admin', { admins: [...kiviConf.admins] })

          return reply('〓 done 〓')
        }
      }
    }
  }

  if (secondCmd === 'notice') {
    if (thirdCmd === 'on') {
      kiviConf.notice.enable = true

      if (saveKiviConf()) {
        reply('〓 notice is now on 〓')
      }
    } else if (thirdCmd === 'off') {
      kiviConf.notice.enable = false

      if (saveKiviConf()) {
        reply('〓 notice is now off 〓')
      }
    }
  }

  if (secondCmd === 'group') {
    if (!['ignore', 'accept', 'refuse'].includes(thirdCmd)) {
      return reply('〓 invalid operation 〓')
    }

    kiviConf.notice.group.request.action = thirdCmd as 'ignore' | 'accept' | 'refuse'

    if (saveKiviConf()) {
      reply(`〓 ${thirdCmd} all groups 〓`)
    }
  }

  if (secondCmd === 'friend') {
    if (!['ignore', 'accept', 'refuse'].includes(thirdCmd)) {
      return reply('〓 invalid operation 〓')
    }

    kiviConf.notice.friend.request.action = thirdCmd as 'ignore' | 'accept' | 'refuse'

    if (saveKiviConf()) {
      reply(`〓 ${thirdCmd} all friends 〓`)
    }
  }
}
