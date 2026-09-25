import type { Page } from '@playwright/test'
import { expect, open, test } from './app'

test('the map of Japan comes up under the name, with no page errors', async ({ page, errors }) => {
  await open(page)
  await expect(page.getByText('The Japanese power market on a map')).toBeVisible()
  expect(errors).toEqual([])
})

test('the clock opens on the newest priced day and scrubs through its half hours', async ({ page }) => {
  await open(page)
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-26')
  await expect(page.getByRole('status')).toHaveText('12:00–12:30 JST')
  await page.getByRole('slider', { name: 'Half hour' }).fill('48')
  await expect(page.getByRole('status')).toHaveText('23:30–00:00 JST')
  await expect(page.getByRole('figure', { name: 'Price scale' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Readout' })).toContainText('12.75')
})

test('a click on Tokyo reads out its price against the system and its neighbors, and what ran on a recorded day', async ({
  page,
}) => {
  await open(page)
  await page.locator('.maplibregl-canvas').click({ position: await tokyo(page) })
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Tokyo')
  await expect(readout).toContainText('Chubu')
  await expect(readout).toContainText('No record for this half hour yet.')
  await page.getByLabel('Delivery day').fill('2026-09-25')
  await page.getByRole('slider', { name: 'Half hour' }).fill('1')
  await expect(readout.getByRole('region', { name: 'What ran' })).toContainText('Demand 25,609 MW')
  await readout.getByRole('button', { name: 'Close' }).click()
  await expect(readout).toContainText('System price')
})

/** Where the Kanto plain falls on the canvas at the opening view of the desktop project. */
async function tokyo(page: Page) {
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!
  return { x: box.width * 0.58, y: box.height * 0.65 }
}
