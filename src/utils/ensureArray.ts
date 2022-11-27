export function ensureArray<T = any>(value: T | T[]) {
  if (Array.isArray(value)) {
    return value
  } else {
    return [value]
  }
}
