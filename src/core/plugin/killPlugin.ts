export default function (modulePath: string) {
  const mod = require.cache[modulePath]

  console.log(mod)

  if (!mod) {
    return
  }

  const ix = require.main?.children?.indexOf(mod)

  if (!ix || ix <= -1) {
    return
  }

  require.main?.children.splice(ix, 1)

  for (const fullpath in require.cache) {
    const modId = require.cache[fullpath]!.id
    const valid = modId.startsWith(mod.path)

    if (valid) {
      console.log(modId)
      delete require.cache[fullpath]
    }
  }

  delete require.cache[modulePath]
}
