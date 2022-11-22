import { writeJsonSync } from 'fs-extra'
import { ConfigPath } from '.'

import type { KiviConf } from './start'

export const kiviConf = {} as KiviConf

export const saveKiviConf = () => {
  writeJsonSync(ConfigPath, kiviConf, { encoding: 'utf-8', spaces: 2 })
}
