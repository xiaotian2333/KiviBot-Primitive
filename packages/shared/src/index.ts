import dayjs from 'dayjs'
import kleur from 'kleur'
import mri from 'mri'
import mustacheee from 'mustacheee'
import prettyMs from 'pretty-ms'
import prompts from 'prompts'
import rfdc from 'rfdc'

export { dayjs, mustacheee, prettyMs, kleur, mri, prompts, rfdc }

export const deepClone = rfdc({ circles: false, proto: false })

export { watch, ref } from 'obj-observer'
export { filesize } from 'filesize'
export { globby, globbySync } from 'globby'
export { string2argv, str2argv } from 'string2argv'
export { loadJsonFile, loadJsonFileSync } from 'load-json-file'

export * from './utils.js'
export * from './plugin.js'
export * from './request.js'
