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
})
