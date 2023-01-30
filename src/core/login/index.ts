import { deviceHandler } from './device'
import { errorHandler } from './error'
import { sliderHandler } from './slider'

import type { MioConf } from '@/core'
import type { Client } from 'oicq'

export * from './qrCode'

export async function bindLoginEvent(bot: Client, conf: MioConf) {
  bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
  bot.on('system.login.slider', ({ url }) => sliderHandler.call(bot, { isFirst: true, url }))
  bot.on('system.login.error', errorHandler)
}
