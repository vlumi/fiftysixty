import { expect, test as base, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/** Requests the basemap makes for tiles, glyphs and sprites are answered empty: the style still loads, nothing is fetched from afar. */
const EMPTY_ASSETS = /\/(planet|natural_earth|fonts|sprites)\//

/** The vector tiles are fetched by MapLibre's worker, so a tile request proves the worker came up. */
const TILE = /\/planet\//

const SPOT = readFileSync(new URL('../src/test/fixtures/jepx-spot.csv', import.meta.url), 'utf8')
const TEPCO = readFileSync(new URL('../src/test/fixtures/tepco-jukyu.csv', import.meta.url), 'utf8')
const KYUSHU = readFileSync(new URL('../src/test/fixtures/kyushu-jukyu.csv', import.meta.url), 'utf8')
const FLOWS = readFileSync(new URL('../src/test/fixtures/occto-renkei.csv', import.meta.url), 'utf8')

/**
 * The app on the morning of 2026-09-26 in Japan, with real days of prices and of TEPCO's and Kyushu's records and no
 * other company's, any page error made into a test failure, and the basemap's assets stubbed.
 */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await provide(errors)
    expect(errors).toEqual([])
  },
  page: async ({ page }, provide) => {
    await page.clock.setFixedTime(new Date('2026-09-26T10:00:00+09:00'))
    await page.route(EMPTY_ASSETS, (route) => route.fulfill({ status: 204 }))
    await page.route('**/data/*-jukyu-*.csv', (route) => route.fulfill({ status: 404 }))
    await page.route('**/data/occto-*.csv', (route) => route.fulfill({ body: FLOWS, contentType: 'text/csv' }))
    await page.route('**/data/jepx-spot-*.csv', (route) =>
      route.request().url().includes('2026')
        ? route.fulfill({ body: SPOT, contentType: 'text/csv' })
        : route.fulfill({ status: 404 }),
    )
    await page.route('**/data/tepco-jukyu-*.csv', (route) => route.fulfill({ body: TEPCO, contentType: 'text/csv' }))
    await page.route('**/data/kyushu-jukyu-*.csv', (route) => route.fulfill({ body: KYUSHU, contentType: 'text/csv' }))
    await provide(page)
  },
})

export { expect }

export async function open(page: Page, path = '/') {
  const tile = page.waitForRequest(TILE)
  await page.goto(path)
  await expect(page.getByRole('heading', { name: '50/60' })).toBeVisible()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
  await tile
}
