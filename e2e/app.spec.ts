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
  await expect(page.getByRole('figure', { name: 'Key' })).toBeVisible()
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
  await expect(page.getByRole('button', { name: 'Tokyo mix, no data' })).toBeVisible()
  await page.getByRole('button', { name: 'Previous day' }).click()
  await page.getByRole('slider', { name: 'Half hour' }).fill('1')
  await expect(readout.getByRole('region', { name: 'What ran' }).getByRole('row', { name: /^Demand/ })).toContainText(
    '25,609',
  )
  await expect(page.getByRole('button', { name: 'Tokyo mix' })).toBeVisible()
  const chart = readout.getByRole('slider', { name: 'Supply over the day' })
  await expect(chart).toHaveAttribute('aria-valuenow', '1')
  await chart.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toHaveText('Yesterday 00:30–01:00 JST')
  await readout.getByRole('button', { name: 'Back' }).click()
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
  await expect(
    readout.getByRole('region', { name: 'What ran' }).getByRole('row', { name: /^Curtailed/ }),
  ).toContainText('2,095')
  await expect(
    readout.getByRole('slider', { name: 'Supply over the day' }).locator('path > title', { hasText: 'Curtailed' }),
  ).toBeAttached()
})

/** A spot on the Kanto plain, east of the column on Tokyo's anchor, as a position on the canvas. */
async function tokyo(page: Page) {
  return beside(page, 'Tokyo', 40)
}

/** A canvas position `dx` pixels from the middle of an area's column, which stands on its anchor. */
async function beside(page: Page, area: string, dx: number) {
  const canvas = (await page.locator('.maplibregl-canvas').boundingBox())!
  const glyph = (await page.getByRole('button', { name: new RegExp(`^${area} mix`) }).boundingBox())!
  return { x: glyph.x + glyph.width / 2 + dx - canvas.x, y: glyph.y + glyph.height / 2 - canvas.y }
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

/** A spot in Hyogo, west of the column on Kansai's anchor, as a position on the canvas. */
async function kansai(page: Page) {
  return beside(page, 'Kansai', -30)
}

test('a story day is a jump away: the day the data found most at the floor', async ({ page }) => {
  await open(page)
  await page.getByRole('combobox', { name: 'Jump to' }).selectOption('floor')
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-22')
  await expect(page.getByRole('complementary', { name: 'Readout' })).toContainText('System price')
})

test('the keys: an arrow steps the half hour, Escape lets a picked area go, ? opens the about', async ({ page }) => {
  await open(page)
  await page.locator('.maplibregl-canvas').click({ position: await tokyo(page) })
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Tokyo')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('status')).toHaveText('Yesterday 12:30–13:00 JST')
  await page.keyboard.press('Escape')
  await expect(readout).toContainText('System price')
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog', { name: 'About' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the light theme is a click away and is kept across a reload', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Light theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
})

test('Japanese is a pick away and is kept across a reload', async ({ page }) => {
  await open(page)
  await page.getByRole('combobox', { name: 'Language' }).selectOption('ja')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await expect(page.getByRole('status')).toHaveText('昨日 12:00–12:30 JST')
  await page.reload()
  await expect(page.getByText('地図で見る日本の電力市場')).toBeVisible()
})
