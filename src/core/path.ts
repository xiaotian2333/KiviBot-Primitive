import path from 'node:path'

export const CWD = process.cwd()
export const ConfigPath = path.join(CWD, 'kivi.json')
export const NodeModulesDir = path.join(CWD, 'node_modules')
export const OicqDataDir = path.join(CWD, 'data/oicq')
export const LogDir = path.join(CWD, 'logs')
export const PluginDir = path.join(CWD, 'plugins')
export const PluginDataDir = path.join(CWD, 'data/plugins')
