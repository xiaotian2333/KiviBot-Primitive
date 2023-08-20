import { loadJsonFileSync } from '@kivi-dev/shared'

export const appJSCode = `
import { start, dirname } from '@kivi-dev/core'

await start(dirname(import.meta))
`.trimStart()

const isDev = !!process.env.DEV

const { version = '' } = JSON.parse(loadJsonFileSync('../package.json'))
const actualVersion = version ? `^${version}` : 'latest'

const pkg = {
  name: 'kivi-bot',
  type: 'module',
  scripts: {
    start: 'node app.js',
  },
  dependencies: {
    '@kivi-dev/core': isDev ? 'workspace:*' : actualVersion,
    '@kivi-dev/plugin': isDev ? 'workspace:*' : actualVersion,
  },
}

export const pkgJSON = JSON.stringify(pkg, null, 2) + '\n'
