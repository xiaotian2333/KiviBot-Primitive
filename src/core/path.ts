import path from 'node:path'

/** node 当前执行路径 */
export const CWD = process.cwd()
/** 配置文件路径 */
export const ConfigPath = path.join(CWD, 'kivi.json')
/** 框架 node_modules 路径 */
export const NodeModulesDir = path.join(CWD, 'node_modules')
/** oicq 数据目录 */
export const OicqDataDir = path.join(CWD, 'data/oicq')
/** logs 日志目录 */
export const LogDir = path.join(CWD, 'logs')
/** plugins 插件目录 */
export const PluginDir = path.join(CWD, 'plugins')
/** plugins 插件数据目录 */
export const PluginDataDir = path.join(CWD, 'data/plugins')
