// Renders public/favicon.svg to PNG icons using the pre-installed Playwright Chromium.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
import { readFileSync } from 'node:fs'
const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
for (const [name, size, rounded] of [['icon-192.png', 192, true], ['icon-512.png', 512, false], ['apple-touch-icon.png', 180, false]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  // iOS rounds corners itself, so the apple icon and maskable icon are full-bleed squares.
  const s = rounded ? svg : svg.replace('rx="112"', 'rx="0"')
  await page.setContent(`<html><body style="margin:0">${s.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true })
  await page.close()
}
await browser.close()
