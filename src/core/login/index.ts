import { deviceHandler } from './device'
import { sliderHandler } from './slider'
import { errorHandler } from './error'

import type { Client } from 'oicq'
import type { KiviConf } from '@/config'

export * from './qrCode'

export async function bindLoginEvent(bot: Client, conf: KiviConf) {
  bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
  bot.on('system.login.slider', ({ url }) => sliderHandler.call(bot, { isFirst: true, url }))
  bot.on('system.login.error', errorHandler)
}
