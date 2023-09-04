import {
  bot,
  defineCronHandler,
  randomInt,
  setup,
  useCron,
  useInfo,
  useMount,
  wait,
} from '@kivi-dev/plugin'

setup('cron', '1.0.0')

const cronHandler = defineCronHandler(async () => {
  const oneMinutes = 60 * 1000
  const randomMinutes = randomInt(10 * oneMinutes, 20 * oneMinutes)

  await wait(randomMinutes)
  await bot().sendPrivateMsg(useInfo().mainAdmin, 'Hello world!')
})

useMount(() => {
  useCron('7 * * * *', cronHandler)
})

export { plugin } from '@kivi-dev/plugin'
