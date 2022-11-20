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
    await reply(PluginText)
  }
}
