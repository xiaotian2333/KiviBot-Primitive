import type { Client, EventMap } from 'oicq'

export const SystemEvents = [
  'system.login.qrcode',
  'system.login.slider',
  'system.login.device',
  'system.login.error',
  'system.online',
  'system.offline.network',
  'system.offline.kickoff',
  'system.offline'
]

export const RequestEvents = [
  'request.friend.add',
  'request.friend.single',
  'request.friend',
  'request.group.add',
  'request.group.invite',
  'request.group',
  'request'
]

export const MessageEvents = [
  'message.private',
  'message.private.friend',
  'message.private.group',
  'message.private.other',
  'message.private.self',
  'message.group',
  'message.group.normal',
  'message.group.anonymous',
  'message.discuss',
  'message'
]

export const NoticeEvents = [
  'notice.friend.increase',
  'notice.friend.decrease',
  'notice.friend.recall',
  'notice.friend.poke',
  'notice.group.increase',
  'notice.group.decrease',
  'notice.group.recall',
  'notice.group.admin',
  'notice.group.ban',
  'notice.group.transfer',
  'notice.group.poke',
  'notice.friend',
  'notice.group',
  'notice'
]

export const SyncEvents = ['sync.message', 'sync.read.private', 'sync.read.group', 'sync.read']

export const OicqEvents = [
  ...SystemEvents,
  ...RequestEvents,
  ...MessageEvents,
  ...NoticeEvents,
  ...SyncEvents,
  'internal.sso',
  'internal.input',
  'guild.message'
] as (keyof EventMap<Client>)[]
