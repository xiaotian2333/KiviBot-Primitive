import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigText = `
#设置 信息
#设置 加管理 <qq>
#设置 删管理 <qq>
#设置 改协议 <id>`.trim()

export async function handleConfigCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    await reply(ConfigText)
  }
}
