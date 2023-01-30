import path from 'node:path'

/** node 当前执行路径 */
export const CWD = process.cwd()
/** 配置文件路径 */
export const AppPath = path.join(CWD, 'app.js')
/** 配置文件路径 */
export const ConfigPath = path.join(CWD, 'mio.json')
/** npm 配置文件路径 */
export const NpmConfPath = path.join(CWD, '.npmrc')
/** package.json 文件路径 */
export const PkgPath = path.join(CWD, 'package.json')
/** logs 日志目录 */
export const LogDir = path.join(CWD, 'logs')
/** plugins 插件目录 */
export const PluginDir = path.join(CWD, 'plugins')
/** 框架 node_modules 路径 */
export const NodeModuleDir = path.join(CWD, 'node_modules')
/** oicq 数据目录 */
export const OicqDataDir = path.join(CWD, 'data/oicq')
/** plugins 插件数据目录 */
export const PluginDataDir = path.join(CWD, 'data/plugins')
