import kleur from 'kleur'

import type { Logger } from './logger.js'

export function showLogo() {
  const tip = `   KiviBot v1.0   `
  const infos = [
    '',
    `${kleur.bgBlack().black(tip)}`,
    `${kleur.bgBlack().green().bold(tip)}`,
    `${kleur.bgBlack().black(tip)}`,
    '',
  ]

  console.info(infos.join('\n'))
}

export function handleException(logger: Logger) {
  const handleException = (e: any) => {
    console.info('213123123')
    logger.error('发生了错误: ', e?.message || JSON.stringify(e) || e)
  }

  process.on('SIGINT', () => {
    logger.fatal('已退出 Kivi')
    process.exit(0)
  })

  process.on('uncaughtException', handleException)
  process.on('unhandledRejection', handleException)
}
