import { useMount, setup, useMatch, segment } from '@kivi-dev/plugin'
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

import { name, version } from './package.json'

import type { MessageHandler } from '@kivi-dev/plugin'

setup(name, version)

const html = fs.readFileSync(path.join(__dirname, 'templates/daily-news.html'), 'utf-8')

useMount(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-setuid-sandbox', '--no-zygote'],
  })

  const page = await browser.newPage()

  async function renderHtml(html = '') {
    await page.setContent(html)
    await page.setViewport({ width: 480, height: 328, deviceScaleFactor: 2 })
    return await page.screenshot()
  }

  const msgHandler: MessageHandler<'all'> = async (e) => {
    e.reply(segment.image(await renderHtml(html)))
  }

  useMatch('.test', msgHandler, { role: 'admin' })
})

export { plugin } from '@kivi-dev/plugin'
