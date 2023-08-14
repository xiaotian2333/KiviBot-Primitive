export const appJSCode = `
import { start, dirname } from '@kivi-dev/core'

await start(dirname(import.meta))
`.trimStart()

const isDev = !!process.env.DEV

const pkg = {
  name: 'kivi-bot',
  type: 'module',
  scripts: {
    start: 'node app.js',
  },
  dependencies: {
    '@kivi-dev/core': isDev ? 'workspace:*' : '^1.0.0',
  },
}

export const pkgJSON = JSON.stringify(pkg, null, 2) + '\n'
