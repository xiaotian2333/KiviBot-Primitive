import { kiviConf, saveKiviConf } from '@/config'
import { parseUin, update } from '@src/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigText = `
〓 KiviBot Config 〓
/config detail
/config admin add <qq>
/config admin rm <qq>
/config notice on
/config notice off
/config exit
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

    const detail = `
〓 Config Detail 〓
login mode: ${kiviConf.login_mode ?? 'null'}
device mode: ${kiviConf.login_mode ?? 'null'}
main admin: ${kiviConf.admins[0] ?? 'null'}
sub admins: ${kiviConf.admins.slice(1).join(', ')}
notice status: ${kiviConf.notice.enable ? 'on' : 'ff'}
friend request: ${friend.request.action ?? 'null'}
invited to group: ${friend.request.action ?? 'null'}
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
          return reply('〓 already admin 〓')
        }

        set.add(qq)

        kiviConf.admins = [mainAdmin, ...set]

        if (saveKiviConf()) {
          bot.emit('kivi.admin', { admins: [...kiviConf.admins] })
          return reply('〓 done 〓')
        }
      } else if (thirdCmd === 'del') {
        if (qq === mainAdmin) {
          return reply('〓 cannot delete mainAdmin 〓')
        }

        if (!set.has(qq)) {
          return reply('〓 not admin 〓')
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

  if (secondCmd === 'check') {
    reply('〓 checking update... 〓')

    if (await update()) {
      return reply('〓 everything is up to date now 〓')
    } else {
      return reply('〓 faild 〓')
    }
  }
}
