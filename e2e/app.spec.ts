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
  // With the chart focused, Shift and an arrow still step the day.
  await page.keyboard.press('Shift+ArrowRight')
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-26')
  await page.keyboard.press('Shift+ArrowLeft')
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

test("the holiday noon: Kansai's lines full from the west and the market split on them, and the east's the frequency converters alone", async ({
  page,
}) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-23')
  await page.getByRole('slider', { name: 'Half hour' }).fill('24')
  await page.locator('.maplibregl-canvas').click({ position: await kansai(page) })
  const lines = page.getByRole('complementary', { name: 'Readout' }).getByRole('region', { name: 'Lines' })
  await expect(lines).toContainText('Kansai–Chugoku split')
  await expect(lines).toContainText('in 3,290 of 3,290')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '50 Hz' }).click()
  await expect(lines).toContainText('Frequency converters')
  await expect(lines).toContainText('in 256 of 1,800')
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

test('with nothing picked, the auction behind the system price stands under the price curve', async ({ page }) => {
  await open(page)
  const readout = page.getByRole('complementary', { name: 'Readout' })
  const chart = readout.getByRole('slider', { name: 'Auction over the day' })
  await expect(chart).toHaveAttribute('aria-valuenow', '25')
  await expect(readout.locator('figcaption', { hasText: 'Cleared' })).toContainText(
    /Offered\s*\d+\.\d GW\s*Asked\s*\d+\.\d GW\s*Cleared\s*\d+\.\d GW/,
  )
  await page.locator('.maplibregl-canvas').click({ position: await tokyo(page) })
  await expect(chart).toHaveCount(0)
})

test('a half of the grid from its toggle: the east summed from its records, and Escape lets it go', async ({
  page,
}) => {
  await open(page)
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await page.getByRole('button', { name: '50 Hz' }).click()
  await expect(readout.getByRole('heading', { level: 2 })).toHaveText(/^50 Hz/)
  await expect(readout.getByRole('heading', { level: 3 })).toHaveText(
    '50 Hz · without Hokkaido and Tohoku, not recorded yet',
  )
  await expect(readout.getByRole('slider', { name: 'Supply over the day' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Kyushu mix/ })).toHaveCSS('opacity', '0.35')
  await expect(page.getByRole('button', { name: /^Tokyo mix/ })).toHaveCSS('opacity', '1')
  await page.keyboard.press('Escape')
  await expect(readout).toContainText('System price')
  await expect(page.getByRole('button', { name: /^Kyushu mix/ })).toHaveCSS('opacity', '1')
  await expect(page.getByRole('button', { name: '50 Hz' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'All Japan' })).toHaveAttribute('aria-pressed', 'true')
})

test('the history view: a press on the heatmap sets the day and the half hour', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'History' }).click()
  const heat = page.getByRole('complementary', { name: 'Readout' }).getByRole('slider', { name: 'Price history' })
  await expect(heat).toHaveAttribute('aria-valuenow', '3')
  await expect(heat).toHaveAttribute('aria-valuetext', /^2026-09-25 \(Fri\) 12:00–12:30: /)
  await expect(page.getByRole('img', { name: 'Market splits' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Price duration' })).toBeVisible()
  const box = (await heat.boundingBox())!
  await heat.click({ position: { x: box.width * 0.125, y: box.height * 0.51 } })
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-22')
  await expect(page.getByRole('status')).toHaveText('4 days ago 12:00–12:30 JST')
  await heat.click({ position: { x: box.width * 0.875, y: box.height * 0.02 } })
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-26')
  await expect(page.getByRole('status')).toHaveText('Today 00:00–00:30 JST')
})

test('a link carries the day, the half hour, the pick and the view, and the address follows the choices', async ({
  page,
}) => {
  await open(page, '/?day=2026-09-22&slot=23&area=kyushu&view=day')
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout.getByRole('heading', { level: 2 })).toHaveText(/^Kyushu/)
  await expect(page.getByRole('status')).toHaveText('4 days ago 11:00–11:30 JST')
  await expect(page.getByRole('button', { name: 'Day', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Half hour' }).click()
  await page.getByRole('button', { name: 'Next day' }).click()
  await expect(page).toHaveURL(/\?day=2026-09-23&slot=23&area=kyushu$/)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '60 Hz' }).click()
  await expect(page).toHaveURL(/\?day=2026-09-23&slot=23&half=60$/)
  await open(page, '/?day=2030-01-01')
  await expect(page.getByLabel('Delivery day')).toHaveValue('2026-09-25')
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
