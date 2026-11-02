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

test('on a phone a picked area opens on its headline row, the rest a tap on it away, the compass clear and the credits in the header', async ({
  page,
}) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-25')
  await page.getByRole('slider', { name: 'Half hour' }).fill('1')
  await page.getByRole('button', { name: 'Tokyo mix' }).click()
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await expect(readout).toContainText('Tokyo')
  await expect(readout.getByRole('region', { name: 'What ran' })).toHaveCount(0)
  await readout.getByRole('button', { expanded: false }).click()
  await expect(readout.getByRole('region', { name: 'What ran' })).toBeVisible()
  await expect(page.locator('.maplibregl-ctrl-compass')).toBeVisible()
  await page.getByRole('button', { name: 'About and credits' }).click()
  await expect(page.getByRole('dialog', { name: 'About' })).toContainText('OpenStreetMap')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('on a phone a finger down a chart scrolls the panel and leaves the half hour, and a finger across it scrubs', async ({
  page,
}) => {
  await open(page)
  await page.getByLabel('Delivery day').fill('2026-09-25')
  await page.getByRole('slider', { name: 'Half hour' }).fill('10')
  await page.getByRole('button', { name: 'Tokyo mix' }).click()
  const readout = page.getByRole('complementary', { name: 'Readout' })
  await readout.getByRole('button', { expanded: false }).click()
  const chart = readout.getByRole('slider', { name: 'Price over the day' })
  await expect(chart).toBeVisible()
  const box = (await chart.boundingBox())!
  const status = page.getByRole('status')
  const before = await status.textContent()
  const cdp = await page.context().newCDPSession(page)
  const swipe = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
    for (let i = 1; i <= 8; i++)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8 }],
      })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const x = box.x + box.width / 2
  await swipe({ x, y: box.y + box.height - 4 }, { x, y: box.y - 120 })
  await expect.poll(() => readout.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await expect(status).toHaveText(before!)
  await chart.scrollIntoViewIfNeeded()
  const after = (await chart.boundingBox())!
  const y = after.y + after.height / 2
  await swipe({ x: after.x + 40, y }, { x: after.x + after.width - 20, y })
  await expect(status).not.toHaveText(before!)
})
