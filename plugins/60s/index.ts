// import { register } from '@kivi-dev/core'
import { bot, on, setup, useEnable, useConfig } from '@kivi-dev/plugin'

// await setup(import.meta)

const { config, mutate } = useConfig() // plugin, bot, client

// register('generateHtml', (...args: any[]) => {
//   console.log('generateHtml', args)
// })

useEnable(() => {
  console.log('plugin enabled!')

  return () => {
    console.log('plugin disabled!')
  }
})

export { plugin as default } from '@kivi-dev/plugin'
