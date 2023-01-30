export const js_template = `
const { MioPlugin, segment } = require('miobot')

const { version } = require('./package.json')
const plugin = new MioPlugin('xxx', version)

const config = {}

plugin.onMounted((bot, admins) => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  plugin.onMessage((event, bot) => {
    const { raw_message } = event

    if (raw_message === 'hello') {
      const msgs = [segment.face(66), 'world']

      event.reply(msgs)
    }
  })
})

module.exports = { plugin }
`.trim()
