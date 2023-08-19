# Kivi

Just run の Bot on Tencent [IM](https://im.qq.com).

## Usage

1. create a project via `npm create`

```bash
npm create kivi
```

2. install dependencies

```bash
cd kivi-bot
npm install
```

> you might need to config `sign_api_addr` in: `kivi.json` > `oicq_config` > `sign_api_addr`

3. run Kivi

```bash
npm start
```

send `.h` to bot to get more help info.

## Plugin

create a TS file in `plugins/demo/index.ts`

```typescript
import { setup, useBot, useOn, useConfig, useLogger, useMount } from '@kivi-dev/plugin'

setup('Plugin Fot Test', '1.0.0')

const logger = useLogger()

useMount(async () => {
  logger.info('plugin mount')

  const { mainAdmin, config } = useConfig()
  const bot = useBot()

  logger.log(config)

  config.value = [1, 2, 3]
  config.value.push(4)

  await bot.sendPrivateMsg(mainAdmin, 'hi')
})

useOn('message.group', async (event) => {
  if (event.raw_message === 'hi') {
    await event.reply('hi! ' + event.sender.nickname)
  }
})

export { plugin } from '@kivi-dev/plugin'
```

then send `.p on test` to bot to enable this plugin.

## License

MPL-2.0
