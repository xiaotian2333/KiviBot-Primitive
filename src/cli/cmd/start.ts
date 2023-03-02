import fs from 'fs-extra'
import { spawn } from 'node:child_process'
import path from 'node:path'

import { exitWithError } from '@/utils'

export async function start() {
  if (!fs.existsSync(path.join(__dirname, 'app.js'))) {
    exitWithError("can't find `app.js` in current dir, please exec in bot root dir or init first")
  }

  const node = spawn('node', ['app.js'], { stdio: 'inherit' })

  node.stdout?.on('data', (data) => console.log(data.toString()))
  node.stderr?.on('data', (data) => console.error(data.toString()))

  node.on('error', (err) => console.error(err))
}
