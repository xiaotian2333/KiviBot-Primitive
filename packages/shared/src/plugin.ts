import { globby } from 'globby'
import { loadJsonFile } from 'load-json-file'
import fs from 'node:fs'
import path from 'node:path'

export async function searchAllPlugins(cwd = '') {
  const plugins = await globby('plugins/*', { cwd, onlyDirectories: true })

  return await Promise.all(
    plugins.map(async (dir) => {
      const modulePath = path.join(cwd, dir)
      const pkgPath = path.join(cwd, dir, 'package.json')

      const isPkgExists = fs.existsSync(pkgPath)
      const pkg = (isPkgExists ? await loadJsonFile(pkgPath) : {}) as Record<string, any>

      return {
        name: dir.split('/').at(-1) || dir.replace('plugins/', ''),
        path: modulePath,
        pkg,
      }
    }),
  )
}
