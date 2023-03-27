import fs from 'fs-extra'
import globby from 'globby'
import path from 'node:path'

import { CWD } from '@/path'
import { notice, shuffleString } from '@/utils'

import type { ParsedArgs } from 'minimist'

export async function fix(args: ParsedArgs) {
  const device = args.device
  const deviceFile = args.deviceFile

  if (device) {
    const oicqDevicePath = deviceFile || (await globby('data/oicq/*/*.json'))?.[0]

    if (!oicqDevicePath) {
      notice.error('no device file detected')
      process.exit(1)
    }

    const filePath = path.join(CWD, oicqDevicePath)

    try {
      const config = require(filePath)

      fs.writeJsonSync(
        filePath,
        { ...config, imei: shuffleString(config?.imei || '') },
        { spaces: 2 }
      )

      notice.success('successfully modified device file')
    } catch {
      notice.error('failed to modify device file')
      process.exit(1)
    }
  } else {
    console.log('--device: fix device file')
  }
}
