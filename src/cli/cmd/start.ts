import { spawn } from 'node:child_process'

export async function start() {
  const node = spawn('node', ['app.js'], { stdio: 'inherit' })

  node.stdout?.on('data', (data) => console.log(data.toString()))
  node.stderr?.on('data', (data) => console.error(data.toString()))

  node.on('error', (err) => console.error(err))
}
