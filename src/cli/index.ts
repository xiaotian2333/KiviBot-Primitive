import minimist from 'minimist'

import * as cmds from './cmd'
import { help, checkNodeVersion } from './constants'
import { notice, v } from '@/utils'

const args = minimist(process.argv.slice(2))
const cmd: string | undefined = args._[0]

type Cmd = keyof typeof cmds

async function cli() {
  checkNodeVersion()

  if (args.v || args.version) {
    return console.log(`v${v}`)
  }

  if (!cmd || !Object.keys(cmds).includes(cmd)) {
    console.log(help)
  } else {
    try {
      args._.shift()

      const res = cmds[cmd as Cmd](args)

      if (res instanceof Promise) {
        await res
      }
    } catch (e) {
      console.log(e)
      notice.error('error occurred when executing keli')
      process.exit(1)
    }
  }
}

cli()
