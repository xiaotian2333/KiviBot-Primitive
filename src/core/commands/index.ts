import { plugins } from '../plugin'
import killPlugin from '../plugin/killPlugin'

import type { Client } from 'oicq'
import type { AllMessageEvent } from '../plugin'
import type { AdminArray } from '../start'

export async function handleKiviCommand(e: AllMessageEvent, bot: Client, admins: AdminArray) {
  const isMaster = admins.includes(e.sender.user_id)
  const isGroup = e.message_type === 'group'
  const isPrivateGroup = isGroup && [608391254].includes(e.group_id)

  if (isMaster || isPrivateGroup) {
    if (e.raw_message === '#卸载插件') {
      plugins.forEach((plugin) => plugin._unmount(bot, admins))
      killPlugin('/home/viki/Workspace/KiviBot/lib/core/plugin/demoPlugin.js')
    }

    if (e.raw_message === '#重载插件') {
      plugins.forEach((plugin) => plugin._unmount(bot, admins))
      killPlugin('/home/viki/Workspace/KiviBot/lib/core/plugin/demoPlugin.js')

      try {
        const plugin = (await import('../plugin/demoPlugin')).default
        plugins.add(plugin)

        try {
          plugin._mount(bot, admins)
        } catch (e) {
          // error(`插件挂载（onMounted）过程中发生错误: `, e)
        }
      } catch (e) {
        // error(`插件导入（import）过程中发生错误: `, e)
      }
    }

    // throw new Error()
  }
}
