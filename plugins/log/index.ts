import { logger, setup, useMessage, useMount } from '@kivi-dev/plugin'
import { decode } from 'entities'

setup('log', '1.0.0')

useMount(() => {
  useMessage((e) => logger.info(decode(e.toCqcode())))
})

export { plugin } from '@kivi-dev/plugin'
