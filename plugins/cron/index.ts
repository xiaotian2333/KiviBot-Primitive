import { setup, useCron, useMount, bot, randomInt, wait } from '@kivi-dev/plugin'

setup('cron', '1.0.0')

useMount(() => {
  useCron('7 * * * *', async () => {
    const randomMinutes = randomInt(10 * 60 * 1000, 20 * 60 * 1000)
    await wait(randomMinutes)
    await bot().sendGroupMsg(123456, 'Hello world!')
  })
})

export { plugin } from '@kivi-dev/plugin'
