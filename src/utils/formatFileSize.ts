/** 格式化文件格式大小 */
export function formatFileSize(size: number, hasUnit = true): string {
  const units = ['B', 'K', 'M', 'G', 'T', 'P', 'E']
  for (let i = 0; i < units.length; i++) {
    if (size < 1024) return size.toFixed(1) + (hasUnit ? units[i] : '')
    size = size / 1024
  }
  return (size * 1024).toFixed(1) + (hasUnit ? units[units.length - 1] : '')
}
