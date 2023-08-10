export type DeviceMode = 'sms' | 'qrcode'
export type LoginMode = 'password' | 'qrcode'

export type Pad = 1
export type Phone = 2
export type PC = 3
export type Watch = 4

export type Platform = Phone | Pad | PC | Watch

export interface BotConfig {
  uin: number
  platform: Platform
  admins: number[]
  loginMode: LoginMode
  deviceMode?: DeviceMode
  password?: string
  plugins?: string[]
}

export type InitConfig = BotConfig[]
