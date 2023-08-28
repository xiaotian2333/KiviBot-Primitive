import { useMount, setup } from '@kivi-dev/plugin'
import puppeteer from 'puppeteer'

import { name, version } from './package.json'

setup(name, version)

useMount(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
})

export { plugin } from '@kivi-dev/plugin'
