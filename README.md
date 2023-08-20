# Kivi

Just run の Bot on Tencent [IM](https://im.qq.com).

## Usage

1. create a project via `npm create kivi`

```bash
npm create kivi
```

2. install dependencies

```bash
cd kivi-bot
npm install
```

1. run Kivi

you might need to config your `sign_api_addr` in: `kivi.json` > `oicq_config` > `sign_api_addr`

```bash
npm start
```

send `.h` to bot to get more help info.

## Plugin

support TS/JS plugin out of the box.

you can create a TS or JS file in `plugins/demo/index.ts`

```typescript
import {
  //
  setup,
  //
  useBot,
  useInfo,
  useConfig,
  //
  useOn,
  useCron,
  useMatch,
  useMount,
  useLogger,
  useMessage,
  useCommand,
  //
  registerApi,
  useApi,
  //
  segment,
  axios,
} from '@kivi-dev/plugin'

setup('Plugin Fot Test', '1.0.0')

const logger = useLogger()

useMount(async () => {
  logger.info('plugin mount: ' + useInfo().botConfig)

  const config = useConfig()
  const bot = useBot()

  logger.log(config)

  config.value = [1, 2, 3]
  config.value.push(4)

  await bot.sendPrivateMsg(useInfo().mainAdmin, 'hi')

  useCommand('/test', async (event) => {
    await event.reply('test command')
  })

  useMatch([/hi/], (e) => {
    logger.info('match hi')
  })

  registerApi('apiFromTest', (...args: any[]) => {
    logger.info("args from 'apiFromTest': ", args)
  })

  useCron('*/3 * * * * *', () => {
    logger.info('cron trigger')
    bot.sendPrivateMsg(useInfo().mainAdmin, 'cron trigger')
  })

  useMessage((e) => e.reply('hi'), { type: 'private' })

  useOn('message.group', async (event) => {
    if (event.raw_message === 'hi') {
      await event.reply('hi! ' + event.sender.nickname)
    }
  })
})

export { plugin } from '@kivi-dev/plugin'
```

then send `.p on test` to bot to enable this plugin.

## License

MPL-2.0
