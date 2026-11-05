import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { durationCurve } from '../market/duration'
import { priceHistory } from '../market/history'
import { parseSpot } from '../market/jepx'
import { resetApp, useApp } from '../store'
import DurationCurve from './DurationCurve'

const spot = parseSpot(csv)

afterEach(() => {
  localStorage.clear()
  resetApp()
})

test("the area's curve in its half's color, the displayed half hour marked where it ranks, and the figures under it", () => {
  const { container } = render(
    <DurationCurve
      days={priceHistory(spot, 'tokyo')}
      scope={{ kind: 'area', area: 'tokyo' }}
      date="2026-09-22"
      slot={34}
      onPick={vi.fn()}
    />,
  )
  const chart = screen.getByRole('slider', { name: 'Price duration' })
  expect(chart.querySelector('path')!.className.baseVal).toMatch(/hz50/)
  // Tokyo's 50.01 at 16:30 on the 22nd is the dearest half hour held: it ranks first, at the left edge.
  expect(chart).toHaveAttribute('aria-valuenow', '1')
  expect(chart).toHaveAttribute('aria-valuemax', '192')
  expect(chart).toHaveAttribute('aria-valuetext', '2026-09-22 (Tue) 16:30–17:00: 50.01 ¥/kWh')
  expect(chart.querySelector('line[class*="marker"]')).toHaveAttribute('x1', '34')
  expect(screen.getByText('0%', { selector: 'text[x="37"]' })).toBeInTheDocument()
  const figures = [...container.querySelectorAll('dt')].map(
    (dt) => `${dt.textContent}: ${dt.nextElementSibling!.textContent}`,
  )
  expect(figures).toEqual([
    expect.stringMatching(/^Mean: \d+\.\d\d ¥\/kWh$/),
    expect.stringMatching(/^Median: \d+\.\d\d ¥\/kWh$/),
    expect.stringMatching(/^A tenth of the time above: \d+\.\d\d ¥\/kWh$/),
    expect.stringMatching(/^At the floor: \d+%$/),
  ])
  expect(container.querySelector('figcaption p')).toHaveTextContent(
    '192 half hours, 2026-09-22 to 2026-09-26, the dearest first',
  )
})

test('a press picks the half hour whose price ranks there, the dearest at the left edge and the cheapest at the right', () => {
  const onPick = vi.fn()
  const days = priceHistory(spot, 'tokyo')
  render(<DurationCurve days={days} scope={{ kind: 'area', area: 'tokyo' }} date={null} slot={25} onPick={onPick} />)
  const chart = screen.getByRole('slider', { name: 'Price duration' })
  expect(chart).toHaveAttribute('aria-valuenow', '0')
  chart.getBoundingClientRect = () => ({ left: 0, top: 0, width: 320, height: 118 }) as DOMRect
  chart.setPointerCapture = vi.fn()
  fireEvent.pointerDown(chart, { clientX: 34, clientY: 50, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-22', 34)
  const { ranked } = durationCurve(days)!
  const cheapest = ranked[ranked.length - 1]
  fireEvent.pointerMove(chart, { clientX: 320, clientY: 50, buttons: 1 })
  expect(onPick).toHaveBeenLastCalledWith(cheapest.date, cheapest.slot)
})

test('the system price with nothing picked, in the text color, and no marker without a day', () => {
  useApp.setState({ lang: 'ja' })
  const { container } = render(
    <DurationCurve days={priceHistory(spot)} scope={{ kind: 'system' }} date={null} slot={25} onPick={vi.fn()} />,
  )
  const chart = screen.getByRole('slider', { name: '価格持続曲線' })
  expect(chart.querySelector('path')!.className.baseVal).toMatch(/system/)
  expect(chart.querySelectorAll('line[class*="marker"]')).toHaveLength(0)
  expect(container.querySelector('figcaption p')).toHaveTextContent(/^2026-09-22〜2026-09-26の192コマ、高い順$/)
})

test('the cheapest half hour marked at the right edge keeps its label inside the chart', () => {
  const days = priceHistory(spot)
  const { ranked } = durationCurve(days)!
  const cheapest = ranked[ranked.length - 1]
  render(
    <DurationCurve days={days} scope={{ kind: 'system' }} date={cheapest.date} slot={cheapest.slot} onPick={vi.fn()} />,
  )
  const chart = screen.getByRole('slider', { name: 'Price duration' })
  expect(chart).toHaveAttribute('aria-valuenow', '192')
  expect(chart.querySelector('text[text-anchor="end"][y="15"]')).toHaveTextContent('100%')
})

test('nothing without a priced half hour', () => {
  const { container } = render(
    <DurationCurve days={[]} scope={{ kind: 'system' }} date={null} slot={1} onPick={vi.fn()} />,
  )
  expect(container).toBeEmptyDOMElement()
})
