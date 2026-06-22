// immersive/test/render-check.mjs — headless WebGL2 render check for the immersive app.
//
//   node test/render-check.mjs <url>     (a running preview server)
//
// Off-device CI gate (the Android dev box has no GPU/Chromium). Loads the built app in
// headless Chromium (SwiftShader software WebGL2), taps the start gate, and asserts it boots:
//   - the page loads, a <canvas> is present and sized, WebGL2 is available
//   - saves a phone-viewport screenshot to test/artifacts/immersive.png for human review
//
// Console errors are REPORTED but do not hard-fail: SwiftShader is not a real GPU, so some
// Spark/WebGL warnings are expected here; the screenshot + a real-device check (open the
// deployed preview on a phone) are the richer QA. Exit 0 = pass, 1 = fail, 2 = Playwright missing.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] || 'http://127.0.0.1:4173/'
const here = dirname(fileURLToPath(import.meta.url))
const artifacts = join(here, 'artifacts')
mkdirSync(artifacts, { recursive: true })

let chromium
try {
  ({ chromium } = await import('playwright'))
} catch {
  console.error('Playwright not installed — skipping immersive render check.')
  process.exit(2)
}

const errors = []
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }) // a phone viewport
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + (e.message || e)))

const checks = []
try {
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  checks.push(['page loaded', true])

  // Start gate: tap "Enter" (the gyro/audio gesture) so the scene mounts.
  const enter = page.getByRole('button', { name: /enter/i })
  if (await enter.count()) await enter.first().click().catch(() => {})
  await page.waitForTimeout(4000) // let R3F mount + a few frames advance

  const webgl2 = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))
  checks.push(['WebGL2 available', webgl2])

  const canvas = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    return c ? { w: c.width, h: c.height } : null
  })
  checks.push(['canvas present + sized', !!(canvas && canvas.w > 0 && canvas.h > 0)])

  await page.screenshot({ path: join(artifacts, 'immersive.png') })
  console.log('  -> screenshot: immersive/test/artifacts/immersive.png')
} catch (e) {
  checks.push(['page loaded + rendered', false])
  errors.push('fatal: ' + (e.message || e))
} finally {
  await browser.close()
}

for (const [name, ok] of checks) console.log((ok ? '  ok   ' : 'FAIL   ') + name)
if (errors.length) {
  console.log(`\n  (${errors.length} console/page message(s) — reported, not failing; SwiftShader ≠ real GPU):`)
  for (const e of errors.slice(0, 15)) console.log('    ' + e)
}
const failed = checks.filter(([, ok]) => !ok).length
console.log(`\n${failed ? failed + ' check(s) FAILED' : 'immersive render check passed (see screenshot)'}`)
process.exit(failed ? 1 : 0)
