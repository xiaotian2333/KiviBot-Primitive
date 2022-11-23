import {
  enablePlugin,
  getPluginNameByPath,
  searchAllPlugins,
  getPluginPathByName,
  disablePlugin
} from '@/plugin'
import { plugins } from '@/start'
import { kiviConf, saveKiviConf } from '@/config'
import { KiviLogger } from '@/log'

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
    const { plugins: allPlugins } = await searchAllPlugins()

    const pluginInfo = allPlugins.map((pn: string) => {
      const name = getPluginNameByPath(pn)
      const plugin = plugins.get(name)
      return `${plugin ? '●' : '○'} ${name}${plugin ? ` (${plugin.version})` : ''}`
    })

    const message = `
〓 插件列表 〓
${pluginInfo.join('\n')}
共 ${pluginInfo.length} 个，启用 ${plugins.size} 个
`.trim()

    return reply(message)
  }

  if (secondCmd === '启用所有') {
    const {
      plugins: ps,
      cnts: { all }
    } = await searchAllPlugins()

    if (!all) {
      return reply('〓 本地插件为空 〓')
    }

    if (ps.length === plugins.size) {
      return reply('〓 已启用所有插件 〓')
    }

    ps.forEach(async (path, i) => {
      const pluginName = getPluginNameByPath(path)

      if (plugins.has(pluginName)) {
        // 过滤已经启用了的插件
        return
      }

      await enablePlugin(bot, kiviConf, path)

      if (i + 1 === all) {
        saveKiviConf()

        return reply('〓 已启用所有插件 〓')
      }
    })

    return
  }

  if (secondCmd === '禁用所有') {
    const size = plugins.size

    if (!size) {
      return reply('〓 已禁用所有插件 〓')
    }

    Array.from(plugins.entries()).forEach(async ([pluginName, plugin], i) => {
      const targetPluginPath = await getPluginPathByName(pluginName)

      if (targetPluginPath) {
        await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

        plugins.delete(pluginName)
      }

      if (i + 1 === size) {
        saveKiviConf(plugins)

        return reply('〓 已禁用所有插件 〓')
      }
    })

    return
  }

  if (!pluginName) {
    return reply('〓 命令格式错误 〓')
  }

  if (secondCmd === '启用') {
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 插件 ${pluginName.slice(0, 12)} 不存在 〓`)
    }

    if (plugins.has(pluginName)) {
      return reply('〓 插件已是启用状态 〓')
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
      return reply('〓 插件未启用，无法禁用 〓')
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
