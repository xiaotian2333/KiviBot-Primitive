import { loadJsonFileSync } from '@kivi-dev/shared'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const appJSCode = `
import { start, dirname } from '@kivi-dev/core'

await start(dirname(import.meta))
`.trimStart()

const isDev = !!process.env.DEV
const __dir = path.dirname(fileURLToPath(import.meta.url))
const packagePath = path.join(__dir, '../package.json')

const { version = '' } = loadJsonFileSync(packagePath) as Record<string, string>

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
