import { join } from 'node:path'

export const CWD = process.cwd()
export const ConfigPath = join(CWD, 'kivi.json')
export const NodeModulesDir = join(CWD, 'node_modules')
export const OicqDataDir = join(CWD, 'data/oicq')
export const LogDir = join(CWD, 'logs')
export const PluginDir = join(CWD, 'plugins')
export const PluginDataDir = join(CWD, 'data/plugins')

export { KiviPlugin, KiviPluginError } from '@/plugin'
export { start, KiviConf, MainAdmin, AdminArray } from '@/start'
export * from 'oicq'
