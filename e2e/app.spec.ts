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
  await expect(page.getByRole('button', { name: 'Tokyo mix' })).toBeVisible()
  const chart = readout.getByRole('slider', { name: 'Supply over the day' })
  await expect(chart).toHaveAttribute('aria-valuenow', '1')
  await chart.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toHaveText('00:30–01:00 JST')
  await readout.getByRole('button', { name: 'Close' }).click()
  await expect(readout).toContainText('System price')
})

test('a curtailed noon in Kyushu shows in the mix and on the chart, and its glyph picks it', async ({ page }) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-22')
  await page.getByRole('slider', { name: 'Half hour' }).fill('23')
  await page.getByRole('button', { name: 'Kyushu mix' }).click()
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Kyushu')
  await expect(page.getByRole('status')).toHaveText('11:00–11:30 JST')
  await expect(readout.getByRole('region', { name: 'What ran' })).toContainText('Solar curtailed1,877')
  await expect(
    readout.getByRole('slider', { name: 'Supply over the day' }).locator('path > title', { hasText: 'Curtailed' }),
  ).toBeAttached()
})

/** Where the Kanto plain falls on the canvas at the opening view of the desktop project. */
async function tokyo(page: Page) {
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!
  return { x: box.width * 0.58, y: box.height * 0.65 }
}
