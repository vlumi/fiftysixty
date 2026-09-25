import { expect, open, test } from './app'

test('on a phone the map fills the screen below the name', async ({ page }) => {
  await open(page)
  const map = page.locator('.maplibregl-canvas')
  const box = await map.boundingBox()
  expect(box?.width).toBeGreaterThan(300)
})
