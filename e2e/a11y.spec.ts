import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, open, test } from './app'

/** The page in each of its main states, scanned by axe for serious and critical failures; the map's canvas is left out. */
const STATES: [string, (page: Page) => Promise<unknown>][] = [
  ['the opening view', async () => {}],
  ['an area picked', (page) => page.getByRole('button', { name: /^Tokyo mix/ }).click()],
  [
    'the layers with the fuels open',
    async (page) => {
      await page.getByRole('button', { name: 'Layers' }).click()
      await page.getByRole('button', { name: 'By fuel' }).click()
    },
  ],
  ['the about', (page) => page.getByRole('button', { name: 'About and credits' }).click()],
  [
    'an area picked in the light theme',
    async (page) => {
      await page.getByRole('button', { name: 'Light theme' }).click()
      await page.getByRole('button', { name: /^Tokyo mix/ }).click()
    },
  ],
]

for (const [name, act] of STATES)
  test(`axe finds no serious failure in ${name}`, async ({ page }) => {
    await open(page)
    await act(page)
    const { violations } = await new AxeBuilder({ page }).exclude('.maplibregl-canvas').analyze()
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
  })

test('the about takes focus, keeps Tab inside, and gives focus back to the button that opened it', async ({ page }) => {
  await open(page)
  const about = page.getByRole('button', { name: 'About and credits' })
  await about.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'About' })
  await expect(dialog).toBeFocused()
  for (let i = 0; i < 20; i++) await page.keyboard.press('Tab')
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(about).toBeFocused()
})
