import path from 'node:path'
export * from '@kivi-dev/shared'

export async function start(dir: string = process.cwd()) {
  const rootDir = path.resolve(dir)

  console.log(rootDir)
}
