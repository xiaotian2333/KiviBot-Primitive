export const ts_config = `
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
`.trim()

export const ts_template = `
import { MioPlugin, segment } from '@miobot/core'

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

export { plugin }
`.trim()
