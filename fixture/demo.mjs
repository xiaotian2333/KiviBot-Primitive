import { dirname } from '@vmoe/node-utils'
import jiti from 'jiti'

const plugin = jiti(dirname(import.meta), {
  interopDefault: true,
  esmResolve: true,
  v8cache: false,
  cache: false,
  requireCache: false
})('./p.ts')

plugin.onMounted()
