// import plugin from './p.ts'

require('jiti')().register()

const { default: plugin } = require('./p.ts')

plugin.onMounted()
