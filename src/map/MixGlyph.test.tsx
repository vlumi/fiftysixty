import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import csv from '../test/fixtures/kyushu-jukyu.csv?raw'
import { KYUSHU } from '../market/kyushu'
import { recordSlot } from '../market/record'
import MixGlyph from './MixGlyph'

const noon = recordSlot(KYUSHU.parse(csv), '2026-09-22', 23)!

test('a column of the bands, capped by the curtailment, with a stub below the line for what left, and the demand under it', async () => {
  const onPick = vi.fn()
  render(<MixGlyph name="Kyushu" record={noon} onPick={onPick} />)
  const glyph = screen.getByRole('button', { name: 'Kyushu mix' })
  expect(glyph).toHaveTextContent('9.8 GW')
  const rects = glyph.querySelectorAll('rect')
  expect(rects).toHaveLength(8 + 3)
  const svg = glyph.querySelector('svg')!
  const generated = 2960 + 526 + 1056 + 88 + 148 + 346 + 126 + 608 + 6562 + 116 + 310
  const exports = 1106 + 1944
  expect(Number(svg.getAttribute('height'))).toBeCloseTo((generated + 1877 + 218 + exports) / 500, 3)
  await userEvent.click(glyph)
  expect(onPick).toHaveBeenCalled()
})

test('a source reported negative does not take a band below zero height', () => {
  const odd = { ...noon, bySource: { ...noon.bySource, other: -50 } }
  render(<MixGlyph name="Kyushu" record={odd} onPick={vi.fn()} />)
  for (const rect of screen.getByRole('button', { name: 'Kyushu mix' }).querySelectorAll('rect'))
    expect(Number(rect.getAttribute('height'))).toBeGreaterThanOrEqual(0)
})
