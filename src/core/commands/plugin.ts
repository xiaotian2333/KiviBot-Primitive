import { enablePlugin, getPluginNameByPath, searchAllPlugins } from '../plugin'
import { plugins } from '../start'

import type { Client, MessageRet, Sendable } from 'oicq'
import { kiviConf, saveKiviConf } from '../config'
import { disablePlugin } from '../plugin/disablePlugin'
import { getPluginPathByName } from '../plugin/getPluginPathByName'

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
  console.log(params)

  if (!params.length) {
    return await reply(PluginText)
  }

  const [secondCmd, pluginName] = params

  if (secondCmd === '列表') {
    const { plugins: allPlugins } = await searchAllPlugins()

    const pluginInfo = allPlugins.map((pn: string) => {
      const name = getPluginNameByPath(pn)
      const plugin = plugins.get(name)
      return `${plugin ? '●' : '○'} ${name}${plugin ? ` (${plugin.version})` : ''}`
    })

    const message = `
〓 插件列表 〓
${pluginInfo.join('\n')}
`.trim()

    return reply(message)
  }

  if (secondCmd === '启用所有') {
    return reply('插件启用所有 TODO')
  }

  if (secondCmd === '禁用所有') {
    return reply('插件禁用所有 TODO')
  }

  if (!pluginName) {
    return reply('〓 求你了，看文档 〓')
  }

  if (secondCmd === '启用') {
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 插件 ${pluginName.slice(0, 12)} 不存在 〓`)
    }

    const isOK = await enablePlugin(bot, kiviConf, targetPluginPath)

    if (isOK) {
      saveKiviConf()
    }

    return reply(isOK ? '〓 启用成功 〓' : '〓 启用失败 〓')
  }

  if (secondCmd === '禁用') {
    const plugin = plugins.get(pluginName)

    if (!plugin) {
      return reply('〓 这插件您开了吗您 〓')
    }

    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 插件 ${pluginName.slice(0, 12)} 不存在 〓`)
    }

    const isOK = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

    if (isOK) {
      saveKiviConf()
    }

    return reply(isOK ? '〓 禁用成功 〓' : '〓 禁用失败 〓')
  }

  if (secondCmd === '重载') {
    const plugin = plugins.get(pluginName)
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 插件 ${pluginName.slice(0, 12)} 不存在 〓`)
    }

    let isOK = false

    if (!plugin) {
      isOK = await enablePlugin(bot, kiviConf, targetPluginPath)
    } else {
      isOK = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)
      isOK = isOK && (await enablePlugin(bot, kiviConf, targetPluginPath))
    }

    if (isOK) {
      saveKiviConf()
    }

    return reply(isOK ? '〓 重载成功 〓' : '〓 重载失败 〓')
  }
}
