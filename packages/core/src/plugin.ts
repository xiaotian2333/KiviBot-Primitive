import { searchAllPlugins } from '@kivi-dev/shared'
import createJiti from 'jiti'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// @ts-expect-error fix type
const loadModule = createJiti(fileURLToPath(import.meta.url), {
  extensions: ['.ts', '.mts', '.js', '.mjs'],
  cache: false,
  esmResolve: true,
  requireCache: false,
  v8cache: false,
  sourceMaps: false,
})

export async function loadPlugins(rootDir: string) {
  const plugins = await searchAllPlugins(rootDir)

  return Promise.all(plugins.map((plugin) => enablePlugin(plugin)))
}

export async function enablePlugin(plugin: { path: string; pkg: Record<string, any> }) {
  let res

  try {
    res = loadModule(`${plugin.path}/index`)
  } catch {
    try {
      res = loadModule(`${plugin.path}/src/index`)
    } catch {
      const exports =
        plugin.pkg?.exports['.']?.import ||
        plugin.pkg?.exports['.']?.require ||
        plugin.pkg?.exports['.']?.default ||
        plugin.pkg?.exports['.']

      res = loadModule(path.join(plugin.path, plugin.pkg?.main || plugin.pkg?.module || exports))
    }
  }

  console.log(res)
}
