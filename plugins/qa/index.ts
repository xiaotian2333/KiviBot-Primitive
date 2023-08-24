import { setup, useCmd, useConfig, useMessage, useMount } from '@kivi-dev/plugin'

import { cmdHandlersMap, msgHandler } from './handlers.js'

setup('关键词', '1.0.0')

useMount(() => {
  useConfig<{ words: string[][] }>({ words: [] })

  useCmd(['.qa', 'qa'], cmdHandlersMap)

  useMessage(msgHandler)
})

export { plugin } from '@kivi-dev/plugin'
