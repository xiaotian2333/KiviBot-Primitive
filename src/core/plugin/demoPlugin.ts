import cron from 'node-cron'

import { KiviPlugin } from '.'
import type { BotHandler } from '.'

const plugin = new KiviPlugin('简单关键词')

const main: BotHandler = (bot, admins) => {
  bot.sendPrivateMsg(admins[0], 'Mounted')

  cron.schedule('0,10,20,30,40,50 * * * * *', () => {
    bot.sendPrivateMsg(admins[0], 'cron()')
  })

  plugin.onMessage(async (event) => {
    bot.sendPrivateMsg(admins[0], 'message()')
  })

  plugin.onCmd('你好', (event, args) => {
    event.reply('cmd()')
  })

  plugin.onAdminCmd('#开启本群', (event, args) => {
    event.reply('adminCmd()')
  })

  plugin.on('message', (e) => bot.sendPrivateMsg(1141284758, 'on("message")'))
}

plugin.onMounted(main)

export default plugin
