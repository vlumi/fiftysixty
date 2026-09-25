import { expect, test as base, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

/** Requests the basemap makes for tiles, glyphs and sprites are answered empty: the style still loads, nothing is fetched from afar. */
const EMPTY_ASSETS = /\/(planet|natural_earth|fonts|sprites)\//

/** The vector tiles are fetched by MapLibre's worker, so a tile request proves the worker came up. */
const TILE = /\/planet\//

const SPOT = readFileSync(new URL('../src/test/fixtures/jepx-spot.csv', import.meta.url), 'utf8')
const TEPCO = readFileSync(new URL('../src/test/fixtures/tepco-jukyu.csv', import.meta.url), 'utf8')

/**
 * The app with two real days of prices and of TEPCO's record, any page error made into a test failure, and the
 * basemap's assets stubbed.
 */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await provide(errors)
    expect(errors).toEqual([])
  },
  page: async ({ page }, provide) => {
    await page.route(EMPTY_ASSETS, (route) => route.fulfill({ status: 204 }))
    await page.route('**/data/jepx-spot-*.csv', (route) => route.fulfill({ body: SPOT, contentType: 'text/csv' }))
    await page.route('**/data/tepco-jukyu-*.csv', (route) => route.fulfill({ body: TEPCO, contentType: 'text/csv' }))
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
