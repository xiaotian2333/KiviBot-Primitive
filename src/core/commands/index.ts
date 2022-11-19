import { plugins } from '@/start'
import killPlugin from '@/plugin/killPlugin'

import type { AllMessageEvent } from '@/plugin'
import type { Client } from 'oicq'
import type { KiviConf } from '@/start'

export async function handleKiviCommand(e: AllMessageEvent, bot: Client, conf: KiviConf) {
  const isMaster = conf.admins.includes(e.sender.user_id)
  const isGroup = e.message_type === 'group'
  const isPrivateGroup = isGroup && [608391254].includes(e.group_id)

  if (isMaster || isPrivateGroup) {
    if (e.raw_message === '#启用插件') {
      plugins.forEach((p) => p.unmountKiviBotClient(bot, conf.admins))
    }

    if (e.raw_message === '#重载插件') {
      plugins.forEach((p) => p.unmountKiviBotClient(bot, conf.admins))

      killPlugin('/home/viki/Workspace/KiviBot/lib/core/plugin/demoPlugin.js')

      try {
        const plugin = (await import('../../examples/demoPlugin')).default
        plugins.set('demoPlugin', plugin)

        try {
          plugin.mountKiviBotClient(bot, conf.admins)
        } catch (e) {
          // error(`插件挂载（onMounted）过程中发生错误: `, e)
        }
      } catch (e) {
        // error(`插件导入（import）过程中发生错误: `, e)
      }
    }
  }
}
