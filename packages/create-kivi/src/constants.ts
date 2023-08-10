export const appJSCode = `
import { start } from '@kivi-dev/core'

start(import.meta)
`.trimStart()

const pkg = {
  name: 'kivi-bot',
  scripts: {
    start: 'node app.js',
  },
  dependencies: {
    '@kivi-dev/core': '^1.0.0',
  },
}

export const pkgJSON = JSON.stringify(pkg, null, 2) + '\n'
