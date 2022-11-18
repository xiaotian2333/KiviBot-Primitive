import type { KiviPlugin } from './plugin'

export const plugins: Set<KiviPlugin> = new Set()

export * from './plugin'
export * from './pluginError'
