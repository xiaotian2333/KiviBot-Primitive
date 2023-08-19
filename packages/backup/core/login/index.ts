import { deviceHandler } from './device.js'
import { errorHandler } from './error.js'
import { sliderHandler } from './slider.js'

import type { KeliConf } from '@/core'
import type { Client } from 'movo'

export * from './qrCode.js'

export async function bindLoginEvent(bot: Client, conf: KeliConf) {
  bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
  bot.on('system.login.slider', ({ url }) => sliderHandler.call(bot, { isFirst: true, url }))
  bot.on('system.login.error', errorHandler)
}
