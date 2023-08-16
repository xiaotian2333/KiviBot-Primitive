import type {
  Client,
  Config,
  PrivateMessageEvent,
  GroupMessageEvent,
  DiscussMessageEvent,
} from 'icqq'

export type DeviceMode = 'sms' | 'qrcode'
export type LoginMode = 'password' | 'qrcode'

export type Pad = 1
export type Phone = 2
export type PC = 3
export type Watch = 4

export type Platform = Pad | Phone | PC | Watch

export type AnyFunc = (...args: any[]) => any
export type FirstParam<Fn extends AnyFunc> = Fn extends (p: infer R) => any ? R : never
export type AdminArray = [mainAdmin: number, ...subAdmins: number[]]

export type AllMessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
export type OicqMessageHandler = (event: AllMessageEvent) => any
export type MessageHandler = (event: AllMessageEvent, bot: Client) => any
export type PrivateMessageHandler = (event: PrivateMessageEvent, bot: Client) => any
export type GroupMessageHandler = (event: GroupMessageEvent, bot: Client) => any

export interface ClientWithApis extends Client {
  apis: {
    [x: string]: AnyFunc
  }
}

/**
 * 处理函数
 *
 * @param {ClientWithApis} bot Bot 实例
 * @param {AdminArray} admins 管理员列表
 */
export type BotHandler = (bot: Client, admins: AdminArray) => any

/**
 * 命令消息处理函数
 * @param {AllMessageEvent} event oicq 消息事件，包含了群聊、私聊与讨论组消息
 * @param {string[]} params 由 minimist 解析后的 `_` 值（不包含命令），可以看作命令的其余参数
 * @param {{[arg: string]: any}} options 由 minimist 解析后的值（不包含 `_` 和 `--`），可以看作命令选项
 */
export type MessageCmdHandler = (
  event: AllMessageEvent,
  params: string[],
  options: {
    [arg: string]: any
  },
) => any

export interface PluginConf {
  debug?: boolean
  enableGroups?: number[]
  enableFriends?: number[]
}

export interface BotConfig {
  uin: number
  prefix: '/'
  platform: Platform
  admins: AdminArray
  loginMode: LoginMode
  deviceMode?: DeviceMode
  password?: string
  plugins?: string[]
  oicq_config?: Config
}
