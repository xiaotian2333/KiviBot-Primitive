import { install, stringifyError, update } from '@src/utils'
import type { Client } from 'oicq'
import type { ReplyFunc } from './config'
import {
  disablePlugin,
  enablePlugin,
  getPluginNameByPath,
  getPluginPathByName,
  searchAllPlugins
} from '@/plugin'
import { kiviConf, saveKiviConf } from '@/config'
import { KiviLogger } from '@/logger'
import { pkg, plugins } from '@/start'

export const PluginMenu = `
〓 KiviBot 插件 〓
/plugin list
/plugin add/rm <name>
/plugin on/off <name>
/plugin onall/offall
/plugin reload <name>
/plugin update <name?>
`.trim()

export async function handlePluginCommand(bot: Client, params: string[], reply: ReplyFunc) {
  if (!params.length) {
    return reply(PluginMenu)
  }

  const [secondCmd, pname] = params

  if (secondCmd === 'list') {
    const { plugins: allPlugins } = await searchAllPlugins()

    const pinfo = allPlugins.map((pn: string) => {
      const name = getPluginNameByPath(pn)
      const plugin = plugins.get(name)
      return `${plugin ? '●' : '○'} ${name}${plugin ? ` (${plugin.version})` : ''}`
    })

    const message = `
〓 KiviBot 插件列表 〓
${pinfo.join('\n')}
共 ${pinfo.length} 个，启用 ${plugins.size} 个
`.trim()

    return reply(pinfo.length ? message : '〓 插件列表为空 〓')
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

    let count = 0

    for (const path of ps) {
      const i = ps.indexOf(path)
      const pname = getPluginNameByPath(path)

      if (plugins.has(pname)) {
        // 过滤已经启用了的插件
        return count++
      }

      const res = await enablePlugin(bot, kiviConf, path)

      if (res === true) {
        count++
      } else {
        await reply(`〓 ${pname} 启用失败 〓\n${res}`)
      }

      if (i + 1 === all) {
        saveKiviConf()

        await reply(`〓 共启用 ${count} 个插件 〓`)
      }
    }
  }

  if (secondCmd === 'offall') {
    const size = plugins.size

    if (!size) {
      return reply('〓 所有插件均已禁用 〓')
    }

    // TODO 将 forEach 用 for of 重写

    Array.from(plugins.entries()).forEach(async ([pname, plugin], i) => {
      const targetPluginPath = await getPluginPathByName(pname)

      if (targetPluginPath) {
        const res = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

        if (res !== true) {
          reply(`〓 ${pname} 禁用失败 〓\n${res}`)
        }

        plugins.delete(pname)
      }

      if (i + 1 === size) {
        saveKiviConf(plugins)

        return reply('〓 已禁用所有插件 〓')
      }
    })

    return
  }

  if (secondCmd === 'update' || secondCmd === 'up') {
    await reply('〓 正在更新插件... 〓')

    const name = pname ? `${pname} ` : ''

    try {
      const upInfo = await update(`kivibot-plugin-${pname || '*'}`)

      if (upInfo) {
        const info = Object.entries(upInfo)
          .map(([k, v]) => `${k.replace('kivibot-plugin-', 'plugin: ')} => ${v.replace('^', '')}`)
          .join('\n')

        const updated = pname ? `〓 ${name}已是最新版本 〓` : '〓 所有插件均为最新版本 〓'

        const msg = info ? `〓 插件更新成功 〓\n${info}\ntip: 需要重载插件才能生效` : updated

        await reply(msg)
      } else {
        await reply(`〓 ${name}更新失败，详情查看日志 〓`)
      }
    } catch (e) {
      KiviLogger.error(stringifyError(e))

      await reply(`〓 ${name}更新失败 〓\n错误信息: ${stringifyError(e)}`)
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`

    return
  }

  if (secondCmd === 'on') {
    if (!pname) {
      return reply('/plugin on <name>')
    }

    const targetPluginPath = await getPluginPathByName(pname)

    if (!targetPluginPath) {
      return reply(`〓 ${pname}: 插件不存在 〓`)
    }

    if (plugins.has(pname)) {
      return reply(`〓 ${pname}: 插件已启用 〓`)
    }

    const res = await enablePlugin(bot, kiviConf, targetPluginPath)

    if (res === true) {
      if (saveKiviConf()) {
        return reply(`〓 ${pname} 启用成功 〓`)
      }
    } else {
      return reply(`〓 ${pname} 启用失败 〓\n${res}`)
    }
  }

  if (secondCmd === 'off') {
    if (!pname) {
      return reply('/plugin off <name>')
    }

    const plugin = plugins.get(pname)

    if (!plugin) {
      return reply(`〓 ${pname}: 插件不存在 〓`)
    }

    const targetPluginPath = await getPluginPathByName(pname)

    if (!targetPluginPath) {
      return reply(`〓 ${pname}: 插件不存在 〓`)
    }

    const res = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)

    if (res === true) {
      plugins.delete(pname)

      if (saveKiviConf()) {
        return reply(`〓 ${pname} 禁用成功 〓`)
      }
    } else {
      return reply(`〓 ${pname} 禁用失败 〓\n${res}`)
    }
  }

  if (secondCmd === 'reload' || secondCmd === 'rl') {
    if (!pname) {
      return reply('/plugin reload <name>')
    }

    const plugin = plugins.get(pname)
    const targetPluginPath = await getPluginPathByName(pname)

    if (!targetPluginPath) {
      return reply(`〓 ${pname}: 插件不存在 〓`)
    }

    let res: boolean | string

    if (!plugin) {
      res = await enablePlugin(bot, kiviConf, targetPluginPath)
    } else {
      res = await disablePlugin(bot, kiviConf, plugin, targetPluginPath)
      res = res && (await enablePlugin(bot, kiviConf, targetPluginPath))
    }

    if (res === true) {
      if (saveKiviConf()) {
        return reply(`〓 ${pname} 重载成功 〓`)
      }
    } else {
      return reply(`〓 ${pname} 重载失败 〓\n${res}`)
    }
  }

  if (secondCmd === 'add') {
    if (!pname) {
      return reply('/plugin add <name>')
    }

    let shortName = pname

    if (/^kivibot-plugin-/i.test(shortName)) {
      shortName = shortName.replace(/^kivibot-plugin-/i, '')
    }

    await reply(`〓 正在安装 ${pname}... 〓`)

    try {
      if (await install(`kivibot-plugin-${shortName}`)) {
        await reply(`〓 ${pname} 安装成功 〓`)
      } else {
        await reply(`〓 ${pname} 安装失败，详情查看日志 〓`)
      }
    } catch (e) {
      KiviLogger.error(stringifyError(e))

      await reply(`〓 ${pname} 安装失败 〓\n错误信息: ${stringifyError(e)}`)
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`
  }

  if (secondCmd === 'remove' || secondCmd === 'rm') {
    if (!pname) {
      return reply('/plugin rm <name>')
    }

    let shortName = pname

    if (/^kivibot-plugin-/i.test(shortName)) {
      shortName = shortName.replace(/^kivibot-plugin-/i, '')
    }

    await reply(`〓 正在移除 ${pname}... 〓`)

    try {
      if (await install(`kivibot-plugin-${shortName}`, true)) {
        await reply(`〓 ${pname} 移除成功 〓`)
      } else {
        await reply(`〓 ${pname} 移除失败，详情查看日志 〓`)
      }
    } catch (e) {
      KiviLogger.error(stringifyError(e))

      await reply(`〓 ${pname} 移除失败 〓\n错误信息: ${stringifyError(e)}`)
    }

    process.title = `KiviBot ${pkg.version} ${kiviConf.account}`
  }
}
