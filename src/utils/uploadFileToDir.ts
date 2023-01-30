import os from 'node:os'

import { stringifyError } from './utils'
import { MioLogger } from '@/core'

import type { Client } from 'oicq'

export async function uploadFileToDir(
  this: Client,
  group: number,
  filepath: string,
  uploadFilename?: string,
  dirname?: string
): Promise<boolean> {
  try {
    const isWin = os.platform() === 'win32'

    const dir = dirname || String(this.uin)
    const gfs = this.pickGroup(group).fs
    const filename = uploadFilename || filepath.split(isWin ? '\\' : '/').at(-1)

    let isDirExist = false
    let pid = '/'

    const ls = await gfs.ls()

    ls.forEach((l) => {
      if (l.name === dir && l.is_dir) {
        isDirExist = true
        pid = l.fid
      }
    })

    if (!isDirExist) {
      const state = await gfs.mkdir(dir)
      pid = state.fid
    }

    await gfs.upload(filepath, pid, filename)

    return true
  } catch (e) {
    MioLogger.error(stringifyError(e))

    return true
  }
}
