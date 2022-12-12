import {
  enablePlugin,
  getPluginNameByPath,
  searchAllPlugins,
  getPluginPathByName,
  disablePlugin
} from '@/plugin'
import { kiviConf, saveKiviConf } from '@/config'
import { pkg, plugins } from '@/start'
import { update, install } from '@src/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const PluginText = `
〓 KiviBot 插件 〓
/plugin list
/plugin add <name>
/plugin on/off <name>
/plugin onall/offall
/plugin reload <name>
/plugin update <?name>
`.trim()

export async function handlePluginCommand(
  bot: Client,
  params: string[],
  reply: (content: Sendable, quote?: boolean | undefined) => Promise<MessageRet>
) {
  if (!params.length) {
    return await reply(PluginText)
  }

  const [secondCmd, pluginName] = params

  if (secondCmd === 'list') {
    const { plugins: allPlugins } = await searchAllPlugins()

    const pluginInfo = allPlugins.map((pn: string) => {
      const name = getPluginNameByPath(pn)
      const plugin = plugins.get(name)
      return `${plugin ? '●' : '○'} ${name}${plugin ? ` (${plugin.version})` : ''}`
    })

    const message = `
〓 KiviBot 插件列表 〓
${pluginInfo.join('\n')}
共 ${pluginInfo.length} 个，启用 ${plugins.size} 个
`.trim()

    return reply(message)
  }

  if (secondCmd === 'onall') {
    const {
      plugins: ps,
      cnts: { all }
    } = await searchAllPlugins()

    if (all === 0) {
      return reply('〓 插件列表为空 〓')
    }

    if (ps.length === plugins.size) {
      return reply('〓 所有插件均已启用 〓')
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

  if (secondCmd === 'offall') {
    const size = plugins.size

    if (!size) {
      return reply('〓 所有插件均已禁用 〓')
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

  if (secondCmd === 'update') {
    reply('〓 正在检查插件更新... 〓')

    const upInfo = await update(`kivibot-plugin-${pluginName || '*'}`)

    if (upInfo) {
      const info = Object.entries(upInfo)
        .map(([k, v]) => `${k.replace('kivibot-plugin-', '')} => ${v.replace('^', '')}`)
        .join('\n')

      await reply(info ? `〓 插件更新成功 〓\n${info}` : '〓 所有插件均为最新版本 〓')
    } else {
      await reply('〓 更新失败 〓')
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`

    return
  }

  if (secondCmd === 'on') {
    if (!pluginName) {
      return reply('〓 插件名不为空 〓')
    }

    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: 插件不存在 〓`)
    }

    if (plugins.has(pluginName)) {
      return reply(`〓 ${pluginName.slice(0, 12)}: 插件已启用 〓`)
    }

    const isOK = await enablePlugin(bot, kiviConf, targetPluginPath)

    if (isOK) {
      saveKiviConf()
      return reply('〓 启用成功 〓')
    }
  }

  if (secondCmd === 'off') {
    if (!pluginName) {
      return reply('〓 插件名不为空 〓')
    }

    const plugin = plugins.get(pluginName)

    if (!plugin) {
      return reply(`〓 ${pluginName.slice(0, 12)}: 插件不存在 〓`)
    }

    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: 插件不存在 〓`)
    }

    const isOK = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

    if (isOK) {
      plugins.delete(pluginName)
      saveKiviConf()
      return reply('〓 禁用成功 〓')
    }
  }

  if (secondCmd === 'reload') {
    if (!pluginName) {
      return reply('〓 插件名不为空 〓')
    }

    const plugin = plugins.get(pluginName)
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: 插件不存在 〓`)
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
      return reply('〓 重载成功 〓')
    }
  }

  if (secondCmd === 'add') {
    if (!pluginName) {
      return reply('〓 插件名不为空 〓')
    }

    let shortName = pluginName

    if (/^kivibot-plugin-/i.test(shortName)) {
      shortName = shortName.replace(/^kivibot-plugin-/i, '')
    }

    reply('〓 正在安装... 〓')

    if (await install(`kivibot-plugin-${shortName}`)) {
      await reply('〓 插件安装成功 〓')
    } else {
      await reply('〓 安装失败 〓')
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`
  }
}
