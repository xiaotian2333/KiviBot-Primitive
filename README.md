<p align="center">
  <img width="180" src="https://keli.viki.moe/dimo.png" alt="Kivi logo"></img>
</p>

<br/>

<p align="center">
  <a href="https://npmjs.com/package/@kivi-dev/core">
    <img src="https://img.shields.io/npm/v/@kivi-dev/core.svg" alt="npm package">
  </a>
  <a href="https://nodejs.org/en/about/releases/">
    <img src="https://img.shields.io/node/v/@kivi-dev/core.svg" alt="node compatibility">
  </a>
  <a href="https://pkg-size.dev/@kivi-dev/core">
    <img src="https://pkg-size.dev/badge/install/9005796" title="Install size for @kivi-dev/core">
  </a>
  <img src="https://img.shields.io/badge/group-868781587-527dec?logo=TencentQQ&logoColor=ffffff">
  <a href="https://github.com/vikiboss/kivibot/blob/main/LICENSE">
    <img alt="NPM" src="https://img.shields.io/npm/l/%40kivi-dev%2Fcore">
  </a>
</p>
<br/>

# Kivi

> Just run の bot.
>
> 基于 [oicq](#) / [icqq](#)、面向 [Node.js](https://nodejs.org) 开发者的**轻量** QQ 机器人框架。

## 为什么选择 Kivi ？

- 🚲 轻量：无 UI、低占用、安装后大小不到 10MB
- ⚡ 高效：内置协议、语言一致，由 `node` / `bun` 强力驱动
- 📱 跨平台：Windows、Linux、手机平板、路由器、随身 WiFi...
- 🔗 多协议：得益于 [oicq](#) / [icqq](#)，支持手机、平板、手表、macOS
- 📦 注重体验: 一条 QQ 消息即可启用、禁用插件，管理 Bot
- 🚤 极速开发: 极低门槛，几行 JS/TS 代码即能快速实现功能
- 💻 开发者友好: **支持直接加载 TS 插件**、插件热重载、完备的 TS 类型

本项目开发初衷在于提高群活跃氛围、方便群管理，仅供个人娱乐、学习和交流使用，**任何人不得将本项目用于任何非法用途**。

## 快速上手

项目依赖 [Node.js](https://nodejs.org)，请确保本地已安装，且版本 >= 16.14。

1. 通过 `npm create kivi` 命令快速创建项目

```bash
npm create kivi
```

2. 进入项目目录，并安装依赖

```bash
cd kivi-bot
npm install
```

3. 通过 npm 命令启动 Kivi

```bash
npm start
```

向机器人发送 `.h` 或者 `.help` 开始你的 Bot 养成计划～

## 插件

框架本身仅提供**插件管理**和**状态监控**的基础功能, 其他应用性功能你需要通过编写插件来实现。

插件全部放在 `plugins` 目录，每个插件都是一个单独的 `ESM` 模块，支持 TS/JS。

插件数据被存放在 `data/plugins/[pluginName]` 下，`pluginName` 为 `setup` 函数设置的名称。

你可以在 `plugins/demo/index.ts` 创建一个文件，写入以下 TS 代码

> 请注意最后需要导出 `plugin`。

```typescript
import { setup, logger, useMount } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

useMount(async () => {
  logger.info('插件被启用了！')

  return () => {
    logger.info('插件被禁用了！')
  }
})

export { plugin } from '@kivi-dev/plugin'
```

然后发送 `.p on demo` 给 Bot 即可启用插件。

## 插件例子

1. 收到 `hello` 和群聊的 `hi` 时，回复 `world` + 爱心。

```typescript
import { setup, useMount, segment, useMessage, useMatch } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

useMount(() => {
  useMatch('hello', (event) => {
    event.reply(['world ', segment.face(66)])
  })

  useMessage(
    (event) => {
      if (event.raw_message === 'hi') {
        event.reply(['world ', segment.face(66)])
      }
    },
    { type: 'group' },
  ) // 仅群聊
})

export { plugin } from '@kivi-dev/plugin'
```

2. 定时任务

```typescript
import { setup, bot, useMount, useCron, useInfo } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

useMount(() => {
  const { mainAdmin } = useInfo()

  // 使用 crontab 表达式
  useCron('*/3 * * * *', (event) => {
    // 每 3 秒给主管理员发送一条消息
    bot().sendPrivateMsg(mainAdmin, '定时任务触发了！')
  })
})

export { plugin } from '@kivi-dev/plugin'
```

3. 处理命令

```typescript
import { setup, useMount, useCmd, logger } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

useMount(() => {
  // 仅处理群聊中管理员的命令
  useCmd(
    '/hello',
    (event, params, options) => {
      // 比如 /hello param1 param2 -a -bc -n value --option1=test -option2=hello
      logger.info(params, options)
      event.reply('world')
    },
    {
      role: 'admin', // 仅管理员
      type: 'group', // 仅群聊
    },
  )

  // 支持直接声明子命令处理函数
  useCmd('/hello', {
    test(event, params, options) {
      // 比如 /hello test param1 param2 -a -bc -n value --option1=test -option2=hello
      console.log(params, options)
    },
  })
})

export { plugin } from '@kivi-dev/plugin'
```

4. 持久化数据

```typescript
import { setup, useMount, logger, useConfig } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

useMount(() => {
  const config = useConfig()

  logger.info(config) // 第二次启用将会 输出 { value: 114514 }

  config.value = 114514 // 检测到 config 变更将自动保存，下次启用自动读取
})

export { plugin } from '@kivi-dev/plugin'
```

5. 注册 API （插件间通信）

提供了一种多个插件间通信的机制。

```typescript
import { setup, useMount, registerApi, useApi } from '@kivi-dev/plugin'

setup('测试插件', '1.0.0')

// 插件 A
useMount(() => {
  registerApi('testFunc', (a, b) => {
    return a + b
  })
})

// 插件 B
useMount(() => {
  // 得到 3
  const res = useApi('testFunc')(1, 2)
})

export { plugin } from '@kivi-dev/plugin'
```

## API

> 完善中...

- 参考 [plugin](./packages/plugin/src/index.ts#L414-L434) 源码。

## Docker 部署

确保安装了 [Docker](https://www.docker.com/) 环境，拷贝仓库源码里的 `Dockerfile`、`.dockerignore` 和 `docker-compose.yml` 到你的项目根目录下，然后在项目根目录执行以下命令即可。

```bash
docker build -t kivi .
docker compose up -d
```

## 更多

遇到困难？请尝试翻阅 [插件 API 源码](./packages/plugin/src/index.ts) 或者加入企鹅群 [868781587](#) 礼貌提问。

<img style="max-width: 200px" src="./docs/images/group-qrcode.png" alt="qrcode">

## License

[MPL-2.0](LICENSE)
