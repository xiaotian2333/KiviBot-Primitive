import { spawn } from 'node:child_process'

import { mioDeps, installDependencies } from './install'
import { exitHandler } from '..'
import { checkModule } from '@/utils'

export async function start() {
  if (!checkModule('@miobot/core')) {
    await installDependencies(mioDeps)
  }

  process.off('SIGINT', exitHandler)

  const node = spawn('node', ['app.js'], { stdio: 'inherit' })

  node.stdout?.on('data', (data) => console.log(data.toString()))
  node.stderr?.on('data', (data) => console.error(data.toString()))

  node.on('error', (err) => console.error(err))
}

start.help = `
      start\t使用 \`mio.json\` 配置文件启动 miobot`
