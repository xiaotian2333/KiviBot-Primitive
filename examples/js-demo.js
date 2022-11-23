const { KiviPlugin } = reqiure('@kivibot/core')

const plugin = new KiviPlugin('简单关键词', '1.0.0')

plugin.onMounted((bot) => {
  bot.sendPrivateMsg(plugin.admins[0], 'Mounted')

  plugin.onMessage(async (event) => {
    bot.sendPrivateMsg(plugin.admins[0], 'message()')
    plugin.logger.info('message()')
  })

  plugin.onCmd(/hi/gi, (event, args) => {
    event.reply('cmd()')
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

module.exports = plugin
