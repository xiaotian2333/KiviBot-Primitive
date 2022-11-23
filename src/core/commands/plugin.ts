import type { Client, MessageRet, Sendable } from 'oicq'

export const PluginText = `
〓 插件指令 〓
#插件 列表
#插件 启用 <插件名>
#插件 重载 <插件名>
#插件 禁用 <插件名>
#插件 启用所有
#插件 禁用所有`.trim()

export async function handlePluginCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    return await reply(PluginText)
  }

  const [secondCmd, pluginName] = params

  if (secondCmd === '列表') {
    return reply('插件列表 TODO')
  }

  if (secondCmd === '启用') {
    return reply('插件启用 TODO')
  }

  if (secondCmd === '重载') {
    return reply('插件重载 TODO')
  }

  if (secondCmd === '禁用') {
    return reply('插件禁用 TODO')
  }

  if (secondCmd === '启用所有') {
    return reply('插件启用所有 TODO')
  }

  if (secondCmd === '禁用所有') {
    return reply('插件禁用所有 TODO')
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
