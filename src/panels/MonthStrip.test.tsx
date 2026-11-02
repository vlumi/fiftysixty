import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import spotCsv from '../test/fixtures/jepx-spot.csv?raw'
import { dayTotals, priceStats } from '../market/daily'
import { parseSpot } from '../market/jepx'
import { priceAxis } from '../shared/scale'
import { TEPCO } from '../market/tepco'
import MonthStrip from './MonthStrip'

const day = dayTotals(TEPCO.parse(csv).get('2026-09-24')!)
const half = {
  ...day,
  generatedMWh: day.generatedMWh / 2,
  storageOutMWh: day.storageOutMWh / 2,
  demandMWh: day.demandMWh / 2,
}

test('a bar a day, as tall as its supply against the month’s most, the displayed day marked; it scrubs', async () => {
  const onPick = vi.fn()
  render(
    <MonthStrip
      days={[
        { date: '2026-09-23', totals: half, missing: ['hokkaido'] },
        { date: '2026-09-24', totals: day, missing: [] },
      ]}
      date="2026-09-24"
      onPick={onPick}
    />,
  )
  expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument()
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip).toHaveAttribute('aria-valuenow', '2')
  expect(strip).toHaveAttribute('aria-valuetext', expect.stringMatching(/^2026-09-24 \(Thu\): \d+ GWh$/))
  const [a, b] = [...strip.children] as HTMLElement[]
  expect(b).toHaveAttribute('aria-current', 'date')
  // A day with an area left out is marked, and says which.
  expect(a.className).toMatch(/partial/)
  expect(a.title).toMatch(/, without Hokkaido, not recorded yet$/)
  expect(b.className).not.toMatch(/partial/)
  const stack = (column: HTMLElement) => (column.firstChild as HTMLElement).firstChild as HTMLElement
  expect(stack(a).style.height).toBe('50%')
  expect(stack(b).style.height).toBe('100%')
  // The keys are the page's: an arrow steps the half hour, Shift and an arrow the day.
  fireEvent.keyDown(strip, { key: 'ArrowLeft' })
  expect(onPick).not.toHaveBeenCalled()
  strip.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect
  strip.setPointerCapture = vi.fn()
  fireEvent.pointerDown(strip, { clientX: 20, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-23')
  onPick.mockClear()
  fireEvent.pointerMove(strip, { clientX: 190, buttons: 1 })
  expect(onPick).not.toHaveBeenCalled()
})

test('a single day is no month to compare', () => {
  const { container } = render(
    <MonthStrip days={[{ date: '2026-09-24', totals: day, missing: [] }]} date={null} onPick={vi.fn()} />,
  )
  expect(container).toBeEmptyDOMElement()
})

test('the price row: a bar a priced day from its low to its high over a scale from zero, the mean a tick, running on past the records', () => {
  const spot = parseSpot(spotCsv)
  const prices = ['2026-09-25', '2026-09-26'].map((date) => ({ date, stats: priceStats(spot.get(date)!, 'tokyo')! }))
  render(
    <MonthStrip
      days={[{ date: '2026-09-24', totals: day, missing: [] }]}
      prices={prices}
      hz={50}
      date="2026-09-26"
      onPick={vi.fn()}
    />,
  )
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip).toHaveAttribute('aria-valuemax', '3')
  expect(strip).toHaveAttribute('aria-valuenow', '3')
  expect(strip).toHaveAttribute('aria-valuetext', `2026-09-26 (Sat): mean ${prices[1].stats.mean.toFixed(2)} ¥/kWh`)
  const [recorded, , priced] = [...strip.children] as HTMLElement[]
  expect(recorded.title).toMatch(/GWh$/)
  expect(recorded.lastElementChild!).toBeEmptyDOMElement()
  const bar = priced.lastElementChild!.firstElementChild as HTMLElement
  expect(bar.className).toMatch(/hz50/)
  const ceiling = priceAxis(Math.max(...prices.map((p) => p.stats.high.price))).top
  expect(parseFloat(bar.style.bottom)).toBeCloseTo((prices[1].stats.low.price / ceiling) * 100)
  expect(parseFloat(bar.style.height)).toBeCloseTo(
    ((prices[1].stats.high.price - prices[1].stats.low.price) / ceiling) * 100,
  )
})

test('prices alone make a month too', () => {
  const spot = parseSpot(spotCsv)
  const prices = [...spot.keys()].sort().map((date) => ({ date, stats: priceStats(spot.get(date)!)! }))
  render(<MonthStrip days={[]} prices={prices} date={null} onPick={vi.fn()} />)
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip.children).toHaveLength(4)
  expect(strip.firstElementChild!.firstElementChild!.firstElementChild!.className).toMatch(/system/)
})
