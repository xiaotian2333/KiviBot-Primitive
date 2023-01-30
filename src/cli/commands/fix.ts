import fg from 'fast-glob'
import { writeFileSync, writeJsonSync } from 'fs-extra'
import path from 'node:path'

import { CWD, NpmConfPath } from '@/path'
import { notice } from '@/utils'

import type { ParsedArgs } from 'minimist'

function shuffleString(str: string) {
  return str
    .split('')
    .sort(() => (Math.random() > 0.5 ? 1 : -1))
    .join('')
}

export async function fix(args: ParsedArgs) {
  const device = args.device
  const deviceFile = args.deviceFile
  const registry = args.registry

  if (device) {
    const oicqDevicePath = deviceFile || (await fg('data/oicq/*/*.json'))?.[0]

    if (!oicqDevicePath) {
      notice.error('设备文件不存在，请在框架目录下执行此命令（需启动过框架才会生成初始设备文件）')
      process.exit(1)
    }

    const filePath = path.join(CWD, oicqDevicePath)

    try {
      const config = require(filePath)
      writeJsonSync(filePath, { ...config, imei: shuffleString(config?.imei || '') }, { spaces: 2 })

      notice.success('成功修改设备描述文件的 IMEI')
    } catch {
      notice.error('设备描述文件修改失败')
    }
  }

  if (registry) {
    writeFileSync(NpmConfPath, 'registry=https://registry.npmmirror.com')
    notice.success('已在当前目录生成 `.npmrc` 并配置了国内镜像源')
  }
}

const tips = ['--device 生成新 IMEI', '--registry 使用镜像源']

fix.help = `
      fix\t修复特定问题，${tips.join('，')}`
