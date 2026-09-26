import { expect, open, test } from './app'

test('on a phone the map fills the screen below the name, the key folded until asked for', async ({ page }) => {
  await open(page)
  const map = page.locator('.maplibregl-canvas')
  const box = await map.boundingBox()
  expect(box?.width).toBeGreaterThan(300)
  await expect(page.getByText('The Japanese power market on a map')).toBeHidden()
  await expect(page.getByRole('figure', { name: 'Key' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Key' }).click()
  await expect(page.getByRole('figure', { name: 'Key' })).toBeVisible()
})

test('on a phone a picked area opens on its headline, the rest a tap away', async ({ page }) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-25')
  await page.getByRole('slider', { name: 'Half hour' }).fill('1')
  await page.getByRole('button', { name: 'Tokyo mix' }).click()
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Tokyo')
  await expect(readout.getByRole('region', { name: 'What ran' })).toHaveCount(0)
  await readout.getByRole('button', { expanded: false }).click()
  await expect(readout.getByRole('region', { name: 'What ran' })).toBeVisible()
})
