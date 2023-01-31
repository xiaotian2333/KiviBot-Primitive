import minimist from 'minimist'
import os from 'node:os'

import { cmds } from './commands'
import { colors, notice, v } from '@/utils'

type Cmd = keyof typeof cmds

const args = minimist(process.argv.slice(2))
const cmd: string | undefined = args._[0]

const Head = `miobot v${v}\n\n`
const HelpHead = `用法：mio <命令> [选项]\n\n命令列表：`

export const exitHandler = () => {
  process.stdout.write(colors.yellow('\n已退出 miobot'))
  process.exit(0)
}

/** 检查 node 版本 */
function versionCheck() {
  const nodeInfo = process.versions.node
  const nodeMajorVersion = nodeInfo.split('.')[0]

  if (Number(nodeMajorVersion) < 14) {
    notice.warn(`要求 node 最低版本为 14，当前为 ${nodeMajorVersion}，请升级 node 版本`)
    process.exit(0)
  }

  const ver = v
  const platform = os.platform()
  const env = `node: ${nodeInfo} | arch: ${platform}-${os.arch()}`

  notice.info(colors.gray(`miobot ${ver} | ${env}`))
}

async function cli() {
  /** 捕获 Ctrl C 中断退出 */
  process.on('SIGINT', exitHandler)

  if (args.debug) {
    versionCheck()
  }

  if (args.v || args.version) {
    return console.log(v)
  }

  if (!cmd || !Object.keys(cmds).includes(cmd)) {
    const helps = Object.values(cmds).map((e) => e.help)

    console.log('\n' + Head + HelpHead + helps.join('') + '\n')
  } else {
    try {
      args._.shift()

      const res = cmds[cmd as Cmd](args)

      if (res instanceof Promise) await res
    } catch (e) {
      console.log(e)
      notice.error('miobot 执行遇到错误，参考上面输出的日志')
    }
  }
}

cli()
