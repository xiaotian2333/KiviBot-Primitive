import { definePlugin } from '@kivi-dev/core'

export default definePlugin({
  name: '60s',
  version: '1.0.0',
  onMessage(bot) {
    bot.pickFriend(114514).sendMsg('Hi')
  }
})
