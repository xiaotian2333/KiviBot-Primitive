import cron from 'node-cron'

import { KiviPlugin } from '../core/plugin/plugin'

import type { ScheduledTask } from 'node-cron'

const plugin = new KiviPlugin('简单关键词')
const tasks: ScheduledTask[] = []

plugin.onMounted((bot) => {
  bot.sendPrivateMsg(plugin.admins[0], 'Mounted')

  const task = cron.schedule('0,10,20,30,40,50 * * * * *', () => {
    bot.sendPrivateMsg(plugin.admins[0], 'cron()')
    plugin.logger.info('cron()')
  })

  tasks.push(task)

  plugin.onMessage(async (event) => {
    bot.sendPrivateMsg(plugin.admins[0], 'message()')
    plugin.logger.info('message()')
  })

  plugin.onCmd(/hi/gi, (event, args) => {
    event.reply('cmd()')
    console.log(args)
    plugin.logger.info('123')
  })

  plugin.onAdminCmd('#开启本群', (event, args) => {
    event.reply('adminCmd()')
    plugin.logger.info('adminCmd()')
  })

  plugin.on('message', (e) => {
    bot.sendPrivateMsg(1141284758, 'on("message")')
    plugin.logger.info("on('message')")
  })
})

plugin.onUnmounted(() => {
  tasks.forEach((task) => task.stop())
})

export default plugin
