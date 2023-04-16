import { deviceHandler } from './device'
import { errorHandler } from './error'
import { sliderHandler } from './slider'

import type { KeliConf } from '@/core'
import type { Client } from 'icqq'

export * from './qrCode'

export async function bindLoginEvent(bot: Client, conf: KeliConf) {
  bot.on('system.login.device', deviceHandler.bind(bot, conf.device_mode))
  bot.on('system.login.slider', ({ url }) => sliderHandler.call(bot, { isFirst: true, url }))
  bot.on('system.login.error', errorHandler)
}
