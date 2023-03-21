import chalk from 'chalk'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import { globby } from 'globby'
import obfuscator from 'javascript-obfuscator'
import path from 'node:path'
import ora from 'ora'

import type { ObfuscatorOptions } from 'javascript-obfuscator'

const compileConfig: ObfuscatorOptions = {
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

const begin = Date.now()
const loading = ora({ color: 'blue' })
const { default: pkg } = await import('../package.json', { assert: { type: 'json' } })

function compile(code: string) {
  return obfuscator.obfuscate(code, compileConfig).getObfuscatedCode()
}

console.log('⏰ ' + dayjs().format('YYYY/MM/DD HH:mm:ss:SSS'))
console.log(chalk.yellow(`🔨 obfuscatoring keli v${pkg.version} now...`))

// 代码混淆加密并压缩 JS 源码
for (const file of await globby('lib/**/*.js')) {
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
console.log(`✅ v${pkg.version} done, cost ${Date.now() - begin} ms`)
