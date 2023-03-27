import dayjs from 'dayjs'
import fse from 'fs-extra'
import globby from 'globby'
import minimist from 'minimist'
import { axios, segment } from 'movo'
import { exec } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import { promisify } from 'node:util'
import { string2argv } from 'string2argv'

import { notice } from './notice'
import { ConfigPath } from '@/path'

import type { AllMessageEvent } from '@/core'
import type { ImageElem } from 'movo'
import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto'

// 导出实用的库
export { dayjs, globby, fse, string2argv }

/** 从字符串解析命令行参数 */
export function parseCommandLine(line: string) {
  return minimist(string2argv(line.trim()))
}

/**
 * 异步延时函数
 * @param {number} ms 等待毫秒数
 * @return {Promise<void>}
 */
export async function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/**
 * MD5 加密
 * @param {BinaryLike} text 待 MD5 加密数据，可以是 `string` 字符串
 * @param {BinaryToTextEncoding | undefined} encoding 返回数据编码，不传返回 `Buffer`，可传 `hex` 等返回字符串
 * @return {Buffer | string} MD5 加密后的数据
 */
export function md5(text: BinaryLike, encoding?: BinaryToTextEncoding): string | Buffer {
  const hash = crypto.createHash('md5').update(text)

  if (encoding) {
    return hash.digest(encoding)
  }

  return hash.digest()
}

/**
 * JS 对象转换成 `urlencoded` 格式字符串 { name: 'Bob', age: 18 } => name=Bob&age=18
 * @param {Record<number | string, any>} obj JS 对象
 * @return {string} 转换后的字符串
 */
export function qs(obj: Record<number | string, any>): string {
  return new URLSearchParams(obj).toString()
}

/**
 * 生成随机整数
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @return {number} 随机范围内的整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * 取数组内随机一项
 * @param {Array<T>} array 待操作数组
 * @return {T} 数组内的随机一项
 */
export function randomItem<T = any>(array: [T, ...T[]]): T {
  return array[randomInt(0, array.length - 1)]
}

/** 获取某个 npm 模块的最新版本，形如 'x.x.x' */
export async function getLatestVersion(module: string) {
  const api = `https://registry.npmjs.org/${module}`
  const accept = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'

  const { data } = await axios.get(api, { headers: { accept } })
  const vs = Object.keys(data?.versions)

  return vs.length ? vs[vs.length - 1] : ''
}

/**  版本号比较，前者大时返回  1，后者大返回  -1，相同返回  0 */
export function compareVersion(v1: string, v2: string) {
  const v1s = v1.split('.')
  const v2s = v2.split('.')

  const length = Math.max(v1s.length, v2s.length)

  for (let i = 0; i < length; i++) {
    const n1 = Number(v1s[i] || 0)
    const n2 = Number(v2s[i] || 0)

    if (n1 > n2) return 1
    if (n1 < n2) return -1
  }

  return 0
}

/**
 * 取格式化时间，默认当前时间，使用 dayjs 的 format 函数封装
 * @param {string | undefined} format 格式化模板，默认'YYYY-MM-DD HH:mm'
 * @param {Date | undefined} date 待格式化的时间，默认当前时间
 * @return {string} 格式化后的时间字符串
 */
export function time(format?: string, date?: Date): string {
  return dayjs(date ?? new Date()).format(format ?? 'YYYY-MM-DD HH:mm')
}

/** 打乱字符串 */
export function shuffleString(str: string) {
  return str
    .split('')
    .sort(() => (Math.random() > 0.5 ? 1 : -1))
    .join('')
}

/**
 * 取消息来源的目标 id，私聊取好友QQ，群聊取群号，讨论组取讨论组号
 * @param {AllMessageEvent} event 消息事件参数
 * @return {number} 目标 id
 */
export function getTargetId(event: AllMessageEvent): number {
  switch (event.message_type) {
    case 'private':
      return event.sender.user_id
    case 'group':
      return event.group_id
    case 'discuss':
      return event.discuss_id
  }
}

/**
 * 错误信息字符串格式化
 * @param {any} error 待处理错误
 * @return {string} stringify 结果
 */
export function stringifyError(error: any): string {
  if (typeof error === 'object') {
    return error?.message ?? JSON.stringify(error, null, 2)
  } else {
    return String(error)
  }
}

/**
 * 确保目标是数组（非数组套一层变成数组，是数组不做处理）
 * @param {T | T[]} value 确保是数组的值
 * @return {T[]} 数组结果
 */
export function ensureArray<T = any>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value
  } else {
    return [value]
  }
}

/**
 * 解析 event.toString() 消息里划分的 qq，支持艾特，可以是 `1141284758` 或者是 `{at:1141284758}` 格式
 *
 * @param {string} qqLikeStr 待解析的字符串
 * @return {number} 解析结果
 */
export function parseUin(qqLikeStr: string): number {
  let qq = 0

  try {
    if (/^\{at:\d+\}$/.test(qqLikeStr)) {
      qq = Number(/^\{at:(\d+)\}$/.exec(qqLikeStr)![1])
    } else if (/^\d+$/.test(qqLikeStr)) {
      qq = Number(/^(\d+)$/.exec(qqLikeStr)![1])
    }
  } catch {}

  return qq
}

/**
 * 判断依赖是否存在
 *
 * @param {string} moduleName 依赖路径
 * @return {boolean} 依赖是否存在
 */
export function moduleExists(moduleName: string): boolean {
  try {
    require.resolve(moduleName)
    return true
  } catch (e) {
    return false
  }
}

/** promisify 的 exec 方法 */
export const promiseExec = promisify(exec)

/** keli LOGO */
export const KeliLogo = `
888    d8P  8888888888 888      8888888
888   d8P   888        888        888  
888  d8P    888        888        888  
888d88K     8888888    888        888  
8888888b    888        888        888  
888  Y88b   888        888        888  
888   Y88b  888        888        888  
888    Y88b 8888888888 88888888 8888888
`.trim()

/** 停止 keli 框架进程并输出规范化 keli 错误信息 */
export function exitWithError(msg: string) {
  notice.error(msg)
  process.exit(1)
}

/** 格式化文件格式大小 */
export function formatFileSize(size: number, full = false, hasUnit = true): string {
  const units = ['B', 'K', 'M', 'G', 'T', 'P', 'E']

  // 全单位模式
  if (full) {
    for (const [idx, value] of units.entries()) {
      if (idx > 0) {
        units[idx] = value + 'B'
      }
    }
  }

  // 文件大小 < 1024 E
  for (let i = 0; i < units.length; i++) {
    if (size < 1024) {
      return size.toFixed(1) + (hasUnit ? units[i] : '')
    }

    size = size / 1024
  }

  // 文件大小 >= 1024 E
  return (size * 1024).toFixed(1) + (hasUnit ? units[units.length - 1] : '')
}

/**
 * Return a string of time span. (30 days per month and 360 days per year by default)
 *
 * @param {number} milliseconds The date diff milliseconds.
 * @param {boolean} [isZh=true] The time locale. True is means Chinese, while false refers to English.
 * @param full
 * @returns {string} Return the time diff description.
 * @example
 *
 * oim.formatDateDiff(new Date('2020/02/07 02:07') - new Date('2001/04/07 04:07'));
 *    // => '19年1月9天22时'
 *
 * oim.formatDateDiff(new Date('2020/02/07 02:07', false) - new Date('2001/04/07 04:07'));
 *    // => '19y1mo9d22h'
 */
export function formatDateDiff(milliseconds: number, isZh = true, full = false) {
  const [ms, s, m, h, d, mo] = [1000, 60, 60, 24, 30, 12]

  const [sl, ml, hl, dl, mol, yl] = [
    ms,
    ms * s,
    ms * s * m,
    ms * s * m * h,
    ms * s * m * h * d,
    ms * s * m * h * d * mo
  ]

  const seconds = Math.floor((milliseconds % ml) / sl)
  const minutes = Math.floor((milliseconds % hl) / ml)
  const hours = Math.floor((milliseconds % dl) / hl)
  const days = Math.floor((milliseconds % mol) / dl)
  const months = Math.floor((milliseconds % yl) / mol)
  const years = Math.floor(milliseconds / yl)

  const sStr = seconds > 0 ? seconds + (isZh ? '秒' : 's') : ''
  const mStr = minutes > 0 ? minutes + (isZh ? (full ? '分钟' : '分') : 'm') : ''
  const hStr = hours > 0 ? hours + (isZh ? (full ? '小时' : '时') : 'h') : ''
  const dStr = days > 0 ? days + (isZh ? '天' : 'd') : ''
  const moStr = months > 0 ? months + (isZh ? '月' : 'mo') : ''
  const yStr = years > 0 ? years + (isZh ? '年' : 'y') : ''

  return `${yStr}${moStr}${dStr}${hStr}${mStr}${sStr}`
}

/** 通过 QQ 号获取任意头像链接或头像元素 */
export function getQQAvatarLink(qq: number, size: number, element: true): ImageElem
export function getQQAvatarLink(qq: number, size: number, element: false): string

export function getQQAvatarLink(qq: number, size = 640, element = false) {
  const link = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=${size}`

  if (element) {
    return segment.image(link)
  } else {
    return link
  }
}

/** 通过群号获取任意群头像链接或头像元素 */
export function getGroupAvatarLink(group: number, size: number, element: true): ImageElem
export function getGroupAvatarLink(group: number, size: number, element: false): string

export function getGroupAvatarLink(group: number, size = 640, element = false) {
  const link = `https://p.qlogo.cn/gh/${group}/${group}/${size}`

  if (element) {
    return segment.image(link)
  } else {
    return link
  }
}

/** 取当前配置的账号 id */
export function getConfigUin() {
  const keliConf = require(ConfigPath)
  return String(keliConf?.account ?? 'keli')
}

/** keli package 信息 */
export const pkg = require(path.join(__dirname, '../../package.json'))

/** keli 版本 */
export const v = pkg.version as string
