import fs from 'fs-extra'
import path from 'node:path'

import { NodeModuleDir } from '@/path'

export function checkModule(moduleName: string) {
  return fs.existsSync(path.join(NodeModuleDir, moduleName))
}
