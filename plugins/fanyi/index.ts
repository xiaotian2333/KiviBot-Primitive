import type { Plugin } from '@kivi-dev/core'

type AnyFunc = (...args: any[]) => any

interface Plugin {
  name: string
  version?: 'auto' | string
  enableGroups?: 'all' | number[]
  enableFriends?: 'all' | number[]

  onMounted?: AnyFunc
  onUnmounted?: AnyFunc

  onMessage?: AnyFunc | AnyFunc[]
  onGroupMessage?: AnyFunc | AnyFunc[]
  onPrivateMessage?: AnyFunc | AnyFunc[]
  onMatch?: AnyFunc | AnyFunc[]
  onGroupMatch?: AnyFunc | AnyFunc[]
  onPrivateMatch?: AnyFunc | AnyFunc[]
  onCron?: AnyFunc | AnyFunc[]
  api?: Record<string, AnyFunc>
}

function onMounted() {}

export default {
  name: '60s',
  onMounted,
  onMessage(ctx, event) {
    ctx.config.qq = 123
    ctx.bot.pickFriend(114514).sendMsg('Hi')
  },
  api: {
    demo() {
      console.log(123)
    }
  }
} satisfies Plugin
