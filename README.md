# @kivibot/core

[![npm version](https://img.shields.io/npm/v/@kivibot/core/latest.svg)](https://www.npmjs.com/package/@kivibot/core)
[![dm](https://shields.io/npm/dm/@kivibot/core)](https://www.npmjs.com/package/@kivibot/core)
[![node engine](https://img.shields.io/node/v/@kivibot/core/latest.svg)](https://nodejs.org)
[![discord](https://img.shields.io/static/v1?label=chat&message=on%20discord&color=7289da&logo=discord)](https://discord.gg/RegGQD3Fu6)

一个还不错的开源 QQ 机器人框架，基于 `Node.js` 和 `oicq2`。

`@kivibot/core` 是 `KiviBot` 的核心库。

## 介绍

`KiviBot` 是使用 [TypeScript](https://www.typescriptlang.org/) 语言编写的 **轻量**、**跨平台** QQ 机器人框架。

提供完备的状态监控、插件管理（支持热更新）、管理员机制、通知和请求处理以及友好的脚手架，开箱即用。框架开源可扩展，插件开发简单。核心协议基于 [oicq2](https://github.com/takayama-lily/oicq)，API 众多，功能强大。框架使用 [node](https://nodejs.org/) 驱动（要求 node 版本 >= 14），得益于 `node` 及其强大的 `v8` 引擎，框架性能可观。

本项目初衷在于提高群活跃氛围、方便群管理，仅供个人娱乐、学习交流使用，**不得将本项目用于任何非法用途**。

## 为什么选择 KiviBot

- 🚲 **轻量**: 无需运行 UI 界面，内存占用低，约 30-100 MB（取决于设备、群聊数和活跃程度）。

- ⚡ **高效**: 框架开发语言和底层协议语言一致，框架依赖少，执行效率高。

- 📦 **便携**: 使用 QQ 消息控制机器人，无需远程连接服务器进行操作，快速方便。

- 📱 **跨平台**: 不仅 Windows，Linux，手机和平板 (通过模拟 Linux 环境) 也能运行。

- 🔗 **多协议**: 支持安卓手机、安卓平板、iPad、安卓手表和 MacOS 协议。

- 🚤 **极速开发**: 学习门槛低，只需几行 JS/TS 代码就能编写插件。

- 💻 **开发者友好**: 插件支持热重载，拥有完备的脚手架与 TS 类型定义。

更多特征等你探索...

## 插件示例

仅需编写少量 JavaScript 代码即可实现丰富功能，参考下面的 Demo。

```js
const { KiviPlugin } = require('@kivibot/core')

const plugin = new KiviPlugin('JS 插件模板', '0.1.0')

plugin.onMounted((bot, [mainAdmin, ...admins]) => {
  bot.sendPrivateMsg(mainAdmin, plugin.name + '插件被启用')

  plugin.on('message.private', (e) => e.reply('Hello World'))
  plugin.onCmd('Hello', (e, args) => e.reply('World'))
  plugin.onAdminCmd('Hello', (e, args) => e.reply('World'))
})

plugin.onUnmounted((bot, [mainAdmin, ...admins]) => {
  bot.sendPrivateMsg(mainAdmin, plugin.name + '插件被禁用')
})

module.exports = plugin
```

想了解更多，请参考官方文档：[KiviBot 测试版文档（建设中）](https://kivi-doc.vercel.app/)
