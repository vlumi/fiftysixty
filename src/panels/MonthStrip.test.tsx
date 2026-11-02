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

test('a column for every day of the month, a bar as tall as the day’s supply against the month’s most, the displayed day marked; it scrubs', async () => {
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
  expect(strip).toHaveAttribute('aria-valuemax', '30')
  expect(strip).toHaveAttribute('aria-valuenow', '24')
  expect(strip).toHaveAttribute('aria-valuetext', expect.stringMatching(/^2026-09-24 \(Thu\): \d+ GWh$/))
  expect(strip.children).toHaveLength(30)
  const [a, b] = [...strip.children].slice(22, 24) as HTMLElement[]
  // A day without data is a blank column, so the others keep their width as the month fills.
  expect(strip.firstElementChild).not.toHaveAttribute('title')
  expect(strip.firstElementChild!.firstElementChild).toBeEmptyDOMElement()
  expect(b).toHaveAttribute('aria-current', 'date')
  // A day with an area left out is marked, and says which.
  expect(a.className).toMatch(/partial/)
  expect(a.title).toMatch(/, without Hokkaido, not recorded yet$/)
  expect(b.className).not.toMatch(/partial/)
  const stack = (column: HTMLElement) => (column.lastChild as HTMLElement).firstChild as HTMLElement
  expect(stack(a).style.height).toBe('50%')
  expect(stack(b).style.height).toBe('100%')
  // The keys are the page's: an arrow steps the half hour, Shift and an arrow the day.
  fireEvent.keyDown(strip, { key: 'ArrowLeft' })
  expect(onPick).not.toHaveBeenCalled()
  // A press on a blank snaps to the nearest day with data.
  strip.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect
  strip.setPointerCapture = vi.fn()
  fireEvent.pointerDown(strip, { clientX: 20, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-23')
  onPick.mockClear()
  fireEvent.pointerMove(strip, { clientX: 295, buttons: 1 })
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
  const prices = ['2026-09-25', '2026-09-26'].map((date) => {
    const { low, high, mean } = priceStats(spot.get(date)!, 'tokyo')!
    return { date, low: low.price, high: high.price, mean }
  })
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
  expect(strip).toHaveAttribute('aria-valuemax', '30')
  expect(strip).toHaveAttribute('aria-valuenow', '26')
  expect(strip).toHaveAttribute('aria-valuetext', `2026-09-26 (Sat): mean ${prices[1].mean!.toFixed(2)} ¥/kWh`)
  const [recorded, , priced] = [...strip.children].slice(23, 26) as HTMLElement[]
  expect(recorded.title).toMatch(/GWh$/)
  expect(recorded.firstElementChild!).toBeEmptyDOMElement()
  const bar = priced.firstElementChild!.firstElementChild as HTMLElement
  expect(bar.className).toMatch(/hz50/)
  const ceiling = priceAxis(Math.max(...prices.map((p) => p.high))).top
  expect(parseFloat(bar.style.bottom)).toBeCloseTo((prices[1].low / ceiling) * 100)
  expect(parseFloat(bar.style.height)).toBeCloseTo(((prices[1].high - prices[1].low) / ceiling) * 100)
  expect(bar.firstElementChild!.className).toMatch(/mean/)
})

test('a half’s price row: the spread across its areas, the tick its weighted price where the records allow, else none', () => {
  const prices = [
    { date: '2026-09-25', low: 8.4, high: 26.19, mean: 15.5 },
    { date: '2026-09-26', low: 10.04, high: 22.02, mean: null },
  ]
  render(<MonthStrip days={[]} prices={prices} hz={60} weighted date="2026-09-26" onPick={vi.fn()} />)
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip).toHaveAttribute('aria-valuetext', '2026-09-26 (Sat): from 10.04 to 22.02 ¥/kWh')
  expect(strip.children[24]).toHaveAttribute('title', '2026-09-25 (Fri): weighted 15.50 ¥/kWh')
  expect(strip.children[24].firstElementChild!.firstElementChild!.firstElementChild).not.toBeNull()
  expect(strip.children[25].firstElementChild!.firstElementChild!.firstElementChild).toBeNull()
})

test('prices alone make a month too', () => {
  const spot = parseSpot(spotCsv)
  const prices = [...spot.keys()].sort().map((date) => {
    const { low, high, mean } = priceStats(spot.get(date)!)!
    return { date, low: low.price, high: high.price, mean }
  })
  render(<MonthStrip days={[]} prices={prices} date={null} onPick={vi.fn()} />)
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip.children).toHaveLength(30)
  expect(strip.children[21].firstElementChild!.firstElementChild!.className).toMatch(/system/)
})
