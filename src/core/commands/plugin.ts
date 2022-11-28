import {
  enablePlugin,
  getPluginNameByPath,
  searchAllPlugins,
  getPluginPathByName,
  disablePlugin
} from '@/plugin'
import { kiviConf, saveKiviConf } from '@/config'
import { plugins } from '@/start'
import { update, install } from '@src/utils'

import type { Client, MessageRet, Sendable } from 'oicq'

export const PluginText = `
〓 KiviBot Plugin 〓
/plugin list
/plugin on <name>
/plugin reload <name>
/plugin off <name>
/plugin add <name>
/plugin update <name>
/plugin onall
/plugin offall
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
〓 Plugin List 〓
${pluginInfo.join('\n')}
${pluginInfo.length} in total, ${plugins.size} on
`.trim()

    return reply(message)
  }

  if (secondCmd === 'onall') {
    const {
      plugins: ps,
      cnts: { all }
    } = await searchAllPlugins()

    if (all === 0) {
      return reply('〓 no plugin 〓')
    }

    if (ps.length === plugins.size) {
      return reply('〓 all are already on 〓')
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

        return reply('〓 done 〓')
      }
    })

    return
  }

  if (secondCmd === 'offall') {
    const size = plugins.size

    if (!size) {
      return reply('〓 all are already off 〓')
    }

    Array.from(plugins.entries()).forEach(async ([pluginName, plugin], i) => {
      const targetPluginPath = await getPluginPathByName(pluginName)

      if (targetPluginPath) {
        await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

        plugins.delete(pluginName)
      }

      if (i + 1 === size) {
        saveKiviConf(plugins)

        return reply('〓 done 〓')
      }
    })

    return
  }

  if (!pluginName) {
    return reply('〓 miss plugin name 〓')
  }

  if (secondCmd === 'on') {
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: not found 〓`)
    }

    if (plugins.has(pluginName)) {
      return reply(`〓 ${pluginName.slice(0, 12)}: already on 〓`)
    }

    const isOK = await enablePlugin(bot, kiviConf, targetPluginPath)

    if (isOK) {
      saveKiviConf()
      return reply('〓 done 〓')
    }
  }

  if (secondCmd === 'off') {
    const plugin = plugins.get(pluginName)

    if (!plugin) {
      return reply('〓 plugin not found 〓')
    }

    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: not found 〓`)
    }

    const isOK = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

    if (isOK) {
      plugins.delete(pluginName)
      saveKiviConf()
      return reply('〓 done 〓')
    }
  }

  if (secondCmd === 'reload') {
    const plugin = plugins.get(pluginName)
    const targetPluginPath = await getPluginPathByName(pluginName)

    if (!targetPluginPath) {
      return reply(`〓 ${pluginName.slice(0, 12)}: not found 〓`)
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
      return reply('〓 done 〓')
    }
  }

  if (secondCmd === 'add') {
    if (await install(pluginName)) {
      return reply('〓 done 〓')
    } else {
      return reply('〓 faild 〓')
    }
  }

  if (secondCmd === 'update') {
    if (await update(pluginName)) {
      return reply('〓 done 〓')
    } else {
      return reply('〓 faild 〓')
    }
  }
}
