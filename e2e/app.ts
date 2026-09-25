import { expect, test as base, type Page } from '@playwright/test'

/** Requests the basemap makes for tiles, glyphs and sprites are answered empty: the style still loads, nothing is fetched from afar. */
const EMPTY_ASSETS = /\/(planet|natural_earth|fonts|sprites)\//

/** The app with any page error made into a test failure and the basemap's assets stubbed. */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await provide(errors)
    expect(errors).toEqual([])
  },
  page: async ({ page }, provide) => {
    await page.route(EMPTY_ASSETS, (route) => route.fulfill({ status: 204 }))
    await provide(page)
  },
})

export { expect }

export async function open(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: '50/60' })).toBeVisible()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
}
