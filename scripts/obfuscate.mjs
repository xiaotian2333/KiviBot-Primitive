import chalk from 'chalk'
import dayjs from 'dayjs'
import fg from 'fast-glob'
import fs from 'fs-extra'
import obfuscator from 'javascript-obfuscator'
import path from 'node:path'
import ora from 'ora'

const compileConfig = {
  target: 'node',
  splitStrings: true,
  selfDefending: true,
  deadCodeInjection: true,
  stringArrayEncoding: ['base64'],
  numbersToExpressions: true,
  unicodeEscapeSequence: true,
  stringArrayWrappersType: 'function',
  identifierNamesGenerator: 'mangled',
  deadCodeInjectionThreshold: 0.1
}

const loading = ora({ color: 'blue' })
const { default: pkg } = await import('../package.json', { assert: { type: 'json' } })

function compile(code) {
  return obfuscator.obfuscate(code, compileConfig).getObfuscatedCode()
}

console.log('⏰ begin: ' + dayjs().format('YYYY/MM/DD HH:mm:ss:SSS'))
console.log(chalk.yellow(`🔨 obfuscatoring keli v${pkg.v} now...`))

// 代码混淆加密并压缩 JS 源码
for (const file of await fg('lib/**/*.js')) {
  loading.start(`obfuscatoring: ${file}`)

  // 原 JS 文件路径
  const filePath = path.join(path.resolve('.'), file)
  // 读取原 JS 代码
  const sourceCode = fs.readFileSync(filePath, { encoding: 'utf8' })
  // 混淆压缩
  const targetCode = compile(sourceCode)

  // 覆盖写入混淆压缩后的代码
  fs.writeFileSync(filePath, targetCode)

  loading.stop()
}

loading.stop()

console.log(`✅ done: ` + dayjs().format('YYYY/MM/DD HH:mm:ss:SSS'))
