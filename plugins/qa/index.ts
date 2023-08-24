import { setup, useCmd, useConfig, useMessage, useMount } from '@kivi-dev/plugin'

import { cmdHandlersMap, msgHandler } from './handlers.js'

setup('关键词', '1.0.0')

export const config = useConfig<{ words: string[][] }>({ words: [] })

useMount(() => {
  useCmd(['.qa', 'qa'], cmdHandlersMap)

  useMessage(msgHandler)
})

export { plugin } from '@kivi-dev/plugin'
