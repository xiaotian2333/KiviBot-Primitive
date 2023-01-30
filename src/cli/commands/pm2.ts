import { spawn } from 'node:child_process'
import os from 'node:os'

import { installDependencies } from './install'
import { exitHandler } from '@/cli'
import { moduleExists, getConfigUin, notice, promiseExec } from '@/utils'

import type { ParsedArgs } from 'minimist'

type Operation = 'start' | 'stop' | 'delete' | 'log'

const isWin = os.platform() === 'win32'
const npx = isWin ? 'npx.cmd' : 'npx'

async function pm2(operation: Operation, force = false) {
  if (!moduleExists('pm2')) {
    await installDependencies('pm2')
  }

  const account = getConfigUin()
  const pm2Args = [npx, 'pm2', operation, 'app.js', '--name', account]

  if (force) {
    pm2Args.push('-f')
  }

  try {
    await promiseExec(pm2Args.join(' '))
    return true
  } catch (e: unknown) {
    console.log(((e as any)?.stderr || e).trim())
    return false
  }
}

async function pm2Spawn(opt = 'log') {
  if (!moduleExists('pm2')) {
    await installDependencies('pm2')
  }

  process.off('SIGINT', exitHandler)

  const account = opt === 'log' ? getConfigUin() : ''
  const pm2 = spawn(npx, ['pm2', opt, account], { stdio: 'inherit' })

  pm2.on('error', (err) => console.error(err))

  pm2.stdout?.on('data', (data) => console.log(data.toString()))
  pm2.stderr?.on('data', (data) => console.error(data.toString()))
}

export async function deploy(args: ParsedArgs) {
  const res = await pm2('start', args.f)

  if (res) {
    notice.info(`已尝试使用 pm2 将 miobot 进程部署在后台`)
  } else {
    notice.error(`操作失败，参考上面的错误日志`)
  }
}

deploy.help = `
      deploy\t使用 pm2 将 miobot 进程部署在后台`

export async function stop(args: ParsedArgs) {
  const res = await pm2('stop', args.f)

  if (res) {
    notice.info(`已尝试停止 pm2 的 miobot 后台进程`)
  } else {
    notice.error(`操作失败，参考上面的错误日志`)
  }
}

stop.help = `
      stop\t停止 pm2 后台的 miobot 进程`

export async function log() {
  await pm2Spawn()
}

log.help = `
      log\t查看 pm2 后台的 miobot 日志`

export async function del(args: ParsedArgs) {
  const res = await pm2('delete', args.f)

  if (res) {
    notice.info(`已尝试删除 pm2 的 miobot 后台进程`)
  } else {
    notice.error(`操作失败，参考上面的错误日志`)
  }
}

del.help = `
      delete\t删除 pm2 后台的 miobot 进程，需先停止`

export async function list() {
  await pm2Spawn('list')
}

list.help = `
      list\t查看 pm2 后台进程列表`
