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
