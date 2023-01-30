#!/usr/bin/env node

'use strict'

const importLocal = require('import-local')

// Prefer the local installation of `miobot`
if (importLocal(__filename)) {
  console.log('Using local version of miobot')
} else {
  process.title = 'miobot'

  require('../lib/cli/index.js')
}
