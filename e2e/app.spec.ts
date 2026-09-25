import type { Page } from '@playwright/test'
import { expect, open, test } from './app'

test('the map of Japan comes up under the name, with no page errors', async ({ page, errors }) => {
  await open(page)
  await expect(page.getByText('The Japanese power market on a map')).toBeVisible()
  expect(errors).toEqual([])
})

test('the clock opens on yesterday, plays into the next day, jumps to now and scrubs through the half hours', async ({
  page,
}) => {
  await open(page)
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-25')
  await expect(page.getByRole('status')).toHaveText('Yesterday 12:00–12:30 JST')
  await page.getByRole('slider', { name: 'Half hour' }).fill('47')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('status')).toHaveText('Yesterday 23:30–00:00 JST')
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-26')
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.getByRole('button', { name: 'Previous day' }).click()
  await page.getByRole('slider', { name: 'Half hour' }).fill('48')
  await expect(page.getByRole('status')).toHaveText('Yesterday 23:30–00:00 JST')
  await page.getByRole('button', { name: 'Now' }).click()
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-26')
  await expect(page.getByRole('status')).toHaveText('Today 10:00–10:30 JST · now')
  await expect(page.getByRole('button', { name: 'Next day' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Now' })).toBeDisabled()
  await expect(page.getByRole('figure', { name: 'Price scale' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Readout' })).toContainText('18.00')
})

test('a click on Tokyo reads out its price against the system and its neighbors, and what ran on a recorded day', async ({
  page,
}) => {
  await open(page)
  await page.locator('.maplibregl-canvas').click({ position: await tokyo(page) })
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Tokyo')
  await expect(readout).toContainText('Chubu')
  await page.getByRole('button', { name: 'Next day' }).click()
  await expect(readout).toContainText('No record for this half hour yet.')
  await page.getByRole('button', { name: 'Previous day' }).click()
  await page.getByRole('slider', { name: 'Half hour' }).fill('1')
  await expect(readout.getByRole('region', { name: 'What ran' })).toContainText('Demand 25,609 MW')
  await expect(page.getByRole('button', { name: 'Tokyo mix' })).toBeVisible()
  const chart = readout.getByRole('slider', { name: 'Supply over the day' })
  await expect(chart).toHaveAttribute('aria-valuenow', '1')
  await chart.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toHaveText('Yesterday 00:30–01:00 JST')
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
  await expect(page.getByRole('status')).toHaveText('4 days ago 11:00–11:30 JST')
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

test("the holiday noon: Kansai's lines full from the west and the market split on them", async ({ page }) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-23')
  await page.getByRole('slider', { name: 'Half hour' }).fill('24')
  await page.locator('.maplibregl-canvas').click({ position: await kansai(page) })
  const lines = page.getByRole('complementary', { name: 'Readout' }).getByRole('region', { name: 'Lines' })
  await expect(lines).toContainText('Kansai–Chugoku split')
  await expect(lines).toContainText('in 6,580 of 6,580')
})

/** The middle of Kansai on the canvas at the opening view of the desktop project. */
async function kansai(page: Page) {
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!
  return { x: box.width * 0.465, y: box.height * 0.72 }
}
