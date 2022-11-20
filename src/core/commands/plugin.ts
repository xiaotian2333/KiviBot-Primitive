import type { Client, MessageRet, Sendable } from 'oicq'

export const PluginText = `
#插件 列表
#插件 启用 <插件名>
#插件 重载 <插件名>
#插件 禁用 <插件名>
#插件 信息 <插件名>`.trim()

export async function handlePluginCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    return await reply(PluginText)
  }

  // if (raw_message === '#重载插件') {
  //   plugins.forEach((p) => p.unmountKiviBotClient(bot, conf.admins))

  //   killPlugin('/home/viki/Workspace/KiviBot/lib/examples/demoPlugin.js')

  //   try {
  //     const plugin = (await import('../../examples/demoPlugin')).default
  //     plugins.set('demoPlugin', plugin)

  //     try {
  //       plugin.mountKiviBotClient(bot, conf.admins)
  //     } catch (e) {
  //       // error(`插件挂载（onMounted）过程中发生错误: `, e)
  //     }
  //   } catch (e) {
  //     // error(`插件导入（import）过程中发生错误: `, e)
  //   }
  // }
}
