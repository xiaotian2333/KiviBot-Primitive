import cron from 'node-cron'

import { KiviPlugin } from './plugin'

import type { ScheduledTask } from 'node-cron'

const plugin = new KiviPlugin('简单关键词')
const tasks: ScheduledTask[] = []

plugin.onMounted((bot) => {
  bot.sendPrivateMsg(plugin.admins[0], 'Mounted')

  const task = cron.schedule('0,10,20,30,40,50 * * * * *', () => {
    bot.sendPrivateMsg(plugin.admins[0], 'cron()')
  })

  tasks.push(task)

  console.log(plugin.pluginDataDir)

  plugin.onMessage(async (event) => {
    bot.sendPrivateMsg(plugin.admins[0], 'message()')
  })

  plugin.onCmd(/hi/gi, (event, args) => {
    event.reply('cmd()')
    console.log(args)
  })

  plugin.onAdminCmd('#开启本群', (event, args) => {
    event.reply('adminCmd()')
  })

  plugin.on('message', (e) => bot.sendPrivateMsg(1141284758, 'on("message1")'))
  plugin.on('message', (e) => bot.sendPrivateMsg(1141284758, 'on("message2")'))
})

plugin.onUnmounted(() => {
  tasks.forEach((task) => task.stop())
})

export default plugin
