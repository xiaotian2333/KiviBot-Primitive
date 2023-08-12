import type { Config } from 'icqq'

export type DeviceMode = 'sms' | 'qrcode'
export type LoginMode = 'password' | 'qrcode'

export type Pad = 1
export type Phone = 2
export type PC = 3
export type Watch = 4

export type Platform = Pad | Phone | PC | Watch

export interface BotConfig {
  uin: number
  prefix: '/'
  platform: Platform
  admins: number[]
  loginMode: LoginMode
  deviceMode?: DeviceMode
  password?: string
  plugins?: string[]
  oicq_config?: Config
}

export type InitConfig = BotConfig[]
