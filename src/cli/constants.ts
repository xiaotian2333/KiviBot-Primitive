import { notice, pkg, v } from '@/utils'

const nodev = process.versions.node
const mainv = Number(nodev.split('.')[0]) || 0

export const help = `
Usage: keli <command> [options...]

commands: 

    init: --start, --production, --dev
    start
    fix: --device, --deviceFile [filePath]
    create [pluginName]?
`.trim()

/** 检查 node 版本 */
export function checkNodeVersion() {
  if (mainv < 14) {
    notice.error(`The needed lowest version of node is 14 (now is ${nodev}), please upgrade`)
    process.exit(1)
  }
}

export const bot_pkg = {
  name: 'keli-bot',
  version: '0.0.0',
  private: true,
  dependencies: {
    keli: `^${v}`
  }
}

export const p_pkg_js = {
  name: 'xxx',
  version: '0.1.0',
  main: 'index.js',
  scripts: {
    release: 'npm publish'
  },
  devDependencies: {
    keli: 'latest'
  }
}

export const p_pkg_ts = {
  name: 'xxx',
  version: '0.1.0',
  main: 'index.js',
  scripts: {
    dev: 'tsc -w',
    build: 'tsc',
    release: 'tsc && npm publish'
  },
  devDependencies: {
    '@types/node': pkg.devDependencies['@types/node'],
    typescript: pkg.devDependencies.typescript,
    keli: 'latest'
  }
}

export const ts_config = {
  compilerOptions: {
    target: 'ES2020',
    module: 'CommonJS',
    moduleResolution: 'node',
    resolveJsonModule: true,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true
  }
}

export const ts_template = `
import { Plugin, segment } from 'keli'

const { version } = require('./package.json')
const plugin = new Plugin('xxx', version)

const config = {}

plugin.onMounted((bot, admins) => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  plugin.onMessage((event, bot) => {
    const { raw_message } = event

    if (raw_message === 'hello') {
      const msgs = [segment.face(66), 'world']

      event.reply(msgs)
    }
  })
})

export { plugin }
`.trim()

export const js_template = `
const { Plugin, segment } = require('keli')

const { version } = require('./package.json')
const plugin = new Plugin('xxx', version)

const config = {}

plugin.onMounted((bot, admins) => {
  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  plugin.onMessage((event, bot) => {
    const { raw_message } = event

    if (raw_message === 'hello') {
      const msgs = [segment.face(66), 'world']

      event.reply(msgs)
    }
  })
})

module.exports = { plugin }
`.trim()
