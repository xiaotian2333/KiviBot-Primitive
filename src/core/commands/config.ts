import type { Client, MessageRet, Sendable } from 'oicq'

export const ConfigText = `
#设置 详情
#设置 加管理 <qq>
#设置 删管理 <qq>
#设置 开启通知
#设置 关闭通知
#设置 检查更新
#设置 终止进程
`.trim()

export async function handleConfigCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    await reply(ConfigText)
  }

  const [secondCmd, value] = params

  if (secondCmd === '详情') {
    return reply('设置详情 TODO')
  }

  if (secondCmd === '加管理') {
    return reply('设置加管理 TODO')
  }

  if (secondCmd === '删管理') {
    return reply('设置删管理 TODO')
  }

  if (secondCmd === '开启通知') {
    return reply('设置开启通知 TODO')
  }

  if (secondCmd === '关闭通知') {
    return reply('设置关闭通知 TODO')
  }

  if (secondCmd === '检查更新') {
    return reply('设置检查更新 TODO')
  }

  if (secondCmd === '终止进程') {
    return reply('设置终止进程 TODO')
  }
}
