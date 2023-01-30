import { exec } from 'node:child_process'
import { promisify } from 'node:util'

export const promiseExec = promisify(exec)

export * from './canBan'
export * from './checkModule'
export * from './colors'
export * from './exitWithError'
export * from './formatFileSize'
export * from './formatTimeDiff'
export * from './getAvatarLink'
export * from './install'
export * from './logo'
export * from './makeForwardMsg'
export * from './notice'
export * from './request'
export * from './update'
export * from './uploadFileToDir'
export * from './utils'
export * from './versionCheck'
export * from './base64'
export * from './getCurrentAccount'
