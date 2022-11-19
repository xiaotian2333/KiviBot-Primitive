export default function (modulePath: string) {
  const mod = require.cache[modulePath]

  if (!mod) {
    return
  }

  delete require.cache[modulePath]

  const idx = require.main?.children?.indexOf(mod)

  if (!idx || idx <= -1) {
    return
  }

  require.main?.children.splice(idx, 1)

  for (const fullpath in require.cache) {
    const modId = require.cache[fullpath]!.id
    const valid = modId.startsWith(mod.path)

    if (valid) {
      delete require.cache[fullpath]
    }
  }
}
