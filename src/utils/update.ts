import { exec } from 'node:child_process'
import { promisify } from 'node:util'

export async function update() {
  const promiseExec = promisify(exec)
  const cmd = `npm up --registry=https://registry.npmmirror.com`

  try {
    const { stderr } = await promiseExec(cmd)

    if (stderr) {
      if (/npm ERR/i.test(String(stderr))) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}
