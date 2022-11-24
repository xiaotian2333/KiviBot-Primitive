// 从 @kivibot/core 里引入 KiviPlugin 插件类
import { KiviPlugin } from '@kivibot/core'

import type { Client, AdminArray, AllMessageEvent } from '@kivibot/core'

// new 一个 KiviBot 插件实例
const plugin = new KiviPlugin('TS插件示例', '1.0.0')

// 插件被启用（被挂载）
plugin.onMounted((bot: Client, admins: AdminArray) => {
  // 插件里有关 bot API 调用相关逻辑放在这个函数里，只有插件被挂载了，才能访问到 bot 实例

  // 调用 bot 实例上的方法
  bot.sendPrivateMsg(admins[0], '插件被启用')

  // 监听 oicq 事件，事件详情参考文档
  plugin.on('message', (e: AllMessageEvent) => e.reply(e.message))

  // 监听命令（命令和参数之间要有空格才能触发，比如：`跟我说 你好`）
  plugin.onCmd('跟我说', (e, args) => e.reply(args[0] || '你倒是说让我说什么啊'))

  // 监听管理员命令，仅对管理员生效（包括主管理员和副管理员）
  plugin.onAdminCmd('我是谁', (e) => e.reply('你是管理员'))
})

// 插件被禁用
plugin.onUnmounted((bot, admins) => {
  // 调用 bot 实例上的方法
  bot.sendPrivateMsg(admins[0], '插件被禁用')
})

// 默认导出 KiviPlugin 实例
export default plugin
