插件编写方式：

```js
const { Plugin } = require('@kivibot/core')

const plugin = new Plugin('百度百科')

plugin.cron('10:20', async (bot) => {})

plugin.message((event, bot) => event.reply('Hello'))

plugin.cmd('你好', (event, args, bot) => event.reply('Hello'))

plugin.adminCmd('#开启本群', (event, args, bot) => {
  // 读写 plugins.enableGroups 会自动 persist data
  if (plugins.enableGroups.has(event.group_id)) {
    event.reply('当前群已经是开启状态')
  } else {
    plugins.enableGroups.add(event.group_id)
    event.reply('已开启')
  }
})

plugin.on('message', (e, bot) => e.reply('Hello World'))
plugin.on('system.', (e, bot) => e.reply('Hello World'))

module.exports = plugin
```
