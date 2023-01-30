import { spawn } from 'node:child_process'

import { exitHandler } from '..'

export async function start() {
  process.off('SIGINT', exitHandler)

  const node = spawn('node', ['app.js'], { stdio: 'inherit' })

  node.stdout?.on('data', (data) => console.log(data.toString()))
  node.stderr?.on('data', (data) => console.error(data.toString()))

  node.on('error', (err) => console.error(err))
}

start.help = `
      start\t使用 \`mio.json\` 配置文件启动 miobot`
