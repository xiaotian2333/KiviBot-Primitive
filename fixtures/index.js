import { createClient } from 'oicq'
const account = 3252186223
const client = createClient(account, { platform: 5 })
client.on('system.online', () => client.logger.info('bot is online'))
client.on('message', (e) => {
  const isMaster = [1141284758].includes(e.sender.user_id)
  const isGroup = e.message_type === 'group'
  const isPrivateGroup = isGroup && [608391254].includes(e.group_id)
  if (isMaster || isPrivateGroup) {
    console.log(e)
  }
})
const handlerQRcode = () => {
  process.stdin.once('data', () => client.login())
}
client.on('system.login.qrcode', handlerQRcode).login()
