/** 通过模块路径获取插件名称，如果是 `npm` 插件，则自动去掉 `kivibot-plugin-` 前缀 */
export function getPluginNameByPath(path: string) {
  const paths = path.split('/')
  return paths[paths.length - 1].replace('kivibot-plugin-', '')
}
