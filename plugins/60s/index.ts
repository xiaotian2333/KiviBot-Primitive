import {
  useBot,
  registerApi,
  useCommand,
  useOn,
  useSetup,
  useMatch,
  useConfig,
  useMount,
} from '@kivi-dev/plugin'

useSetup('60s', '0.0.1')

const bot = useBot()
const config = useConfig('kivi')

useOn('message.discuss', (event) => {
  event.reply('hello')
})

useCommand((ctx) => {}, { role: 'admin', type: 'private' })

useOn('message', (ctx) => {})

registerApi('generateHtml', (...args: any[]) => {
  console.log('generateHtml', args)
})

useMount(() => {
  console.log('plugin enabled!')

  return () => {
    console.log('plugin disabled!')
  }
})

export { plugin } from '@kivi-dev/plugin'
