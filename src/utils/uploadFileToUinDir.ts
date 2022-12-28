import os from 'node:os'

import { KiviLogger } from '@src/core'
import { stringifyError } from './utils'

import type { Client } from 'oicq'

export async function uploadFileToUinDir(
  this: Client,
  group: number,
  filepath: string
): Promise<boolean> {
  try {
    const isWin = os.platform() === 'win32'

    const qq = String(this.uin)
    const GFS = this.pickGroup(group).fs
    const filename = filepath.split(isWin ? '\\' : '/').at(-1)

    let isUinDirExist = false
    let pid = '/'

    const ls = await GFS.ls()

    ls.forEach((l) => {
      if (l.name === qq && l.is_dir) {
        isUinDirExist = true
        pid = l.fid
      }
    })

    if (!isUinDirExist) {
      const state = await GFS.mkdir(qq)
      pid = state.fid
    }

    await GFS.upload(filepath, pid, filename)

    return true
  } catch (e) {
    KiviLogger.error(stringifyError(e))

    return true
  }
}
