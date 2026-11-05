import { render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { priceHistory } from '../market/history'
import { parseSpot } from '../market/jepx'
import { resetApp, useApp } from '../store'
import DurationCurve from './DurationCurve'

const spot = parseSpot(csv)

afterEach(resetApp)

test("the area's curve in its half's color, the displayed price marked where it ranks, and the figures under it", () => {
  const { container } = render(
    <DurationCurve days={priceHistory(spot, 'tokyo')} scope={{ kind: 'area', area: 'tokyo' }} price={50.01} />,
  )
  const chart = screen.getByRole('img', { name: 'Price duration' })
  expect(chart.querySelector('path')!.className.baseVal).toMatch(/hz50/)
  // The dearest half hour ranks first: the marker stands at the left edge, over 0% of the half hours.
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

test('the system price with nothing picked, in the text color, and no marker without a price', () => {
  useApp.setState({ lang: 'ja' })
  const { container, rerender } = render(
    <DurationCurve days={priceHistory(spot)} scope={{ kind: 'system' }} price={NaN} />,
  )
  const chart = screen.getByRole('img', { name: '価格持続曲線' })
  expect(chart.querySelector('path')!.className.baseVal).toMatch(/system/)
  expect(chart.querySelectorAll('line[class*="marker"]')).toHaveLength(0)
  // The cheapest half hour ranks last: its label stands to the left of the marker at the right edge.
  const cheapest = Math.min(...priceHistory(spot).flatMap((d) => d.prices))
  rerender(<DurationCurve days={priceHistory(spot)} scope={{ kind: 'system' }} price={cheapest} />)
  expect(chart.querySelector('text[text-anchor="end"][y="15"]')).toHaveTextContent(/^(9\d|100)%$/)
  expect(container.querySelector('figcaption p')).toHaveTextContent(/^2026-09-22〜2026-09-26の192コマ、高い順$/)
})

test('nothing without a priced half hour', () => {
  const { container } = render(<DurationCurve days={[]} scope={{ kind: 'system' }} price={NaN} />)
  expect(container).toBeEmptyDOMElement()
})
