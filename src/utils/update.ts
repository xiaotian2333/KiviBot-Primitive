import { exec } from 'node:child_process'
import { promisify } from 'node:util'

export async function update(pkg = '') {
  const promiseExec = promisify(exec)
  const npmUpCmd = `npm up ${pkg} --registry=https://registry.npmmirror.com`

  try {
    const { stderr } = await promiseExec(npmUpCmd)

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
