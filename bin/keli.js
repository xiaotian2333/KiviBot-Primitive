#!/usr/bin/env node

'use strict'

const importLocal = require('import-local')

// Prefer the local installation of `keli`
if (!importLocal(__filename)) {
  process.title = 'keli'
  require('../lib/cli/index.js')
}
