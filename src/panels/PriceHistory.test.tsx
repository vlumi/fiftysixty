import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { priceHistory } from '../market/history'
import { parseSpot } from '../market/jepx'
import { DARK } from '../shared/palette'
import { resetApp, useApp } from '../store'
import PriceHistory from './PriceHistory'

const spot = parseSpot(csv)

afterEach(resetApp)

test('a slider over the priced days, the displayed cell read out and marked by a crosshair; a press picks a cell', () => {
  const onPick = vi.fn()
  render(<PriceHistory days={priceHistory(spot, 'tokyo')} area="tokyo" date="2026-09-22" slot={34} onPick={onPick} />)
  const heat = screen.getByRole('slider', { name: 'Price history' })
  expect(heat).toHaveAttribute('aria-valuemax', '4')
  expect(heat).toHaveAttribute('aria-valuenow', '1')
  expect(heat).toHaveAttribute('aria-valuetext', '2026-09-22 (Tue) 16:30–17:00: 50.01 ¥/kWh')
  const [column, row] = [...heat.querySelectorAll('span')] as HTMLElement[]
  expect(column.style.left).toBe('12.5%')
  expect(parseFloat(row.style.top)).toBeCloseTo((33.5 / 48) * 100)
  heat.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 96 }) as DOMRect
  heat.setPointerCapture = vi.fn()
  fireEvent.pointerDown(heat, { clientX: 190, clientY: 1, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-26', 1)
  fireEvent.pointerMove(heat, { clientX: 60, clientY: 95, buttons: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-23', 48)
  // The keys are the page's; the slider itself does nothing with them.
  fireEvent.keyDown(heat, { key: 'ArrowLeft' })
  expect(onPick).toHaveBeenCalledTimes(2)
  // The key names the area and shows its half's ramp, with the ends of the map's domain.
  const legend = heat.closest('figure')!.querySelector('figcaption')!
  expect(legend).toHaveTextContent('Tokyo')
  expect(legend).toHaveTextContent('050+ ¥/kWh')
  expect((legend.children[1] as HTMLElement).style.background).toContain(`rgb(${DARK.price[50][3].join(', ')})`)
})

test('the system price with nothing picked, in the neutral ramp, and the months ticked along the foot', () => {
  const days = [
    ...priceHistory(new Map([['2025-12-31', spot.get('2026-09-22')!]])),
    ...priceHistory(new Map([['2026-01-01', spot.get('2026-09-23')!]])),
    ...priceHistory(spot),
  ]
  const { container } = render(<PriceHistory days={days} area={null} date={null} slot={25} onPick={vi.fn()} />)
  const heat = screen.getByRole('slider', { name: 'Price history' })
  expect(heat).toHaveAttribute('aria-valuenow', '0')
  expect(heat).not.toHaveAttribute('aria-valuetext')
  expect(heat.querySelectorAll('span')).toHaveLength(0)
  const months = heat.nextElementSibling!
  expect([...months.children].map((m) => m.textContent)).toEqual(['Dec', '2026', 'Sep'])
  expect((months.children[2] as HTMLElement).style.left).toBe(`${(2 / 6) * 100}%`)
  const legend = container.querySelector('figcaption')!
  expect(legend).toHaveTextContent('System price')
  expect((legend.children[1] as HTMLElement).style.background).toContain(`rgb(${DARK.price.system[3].join(', ')})`)
})

test('in Japanese the months are numbered and a January is its year', () => {
  useApp.setState({ lang: 'ja' })
  const days = [
    ...priceHistory(new Map([['2026-01-01', spot.get('2026-09-23')!]])),
    ...priceHistory(new Map([['2026-02-01', spot.get('2026-09-23')!]])),
  ]
  render(<PriceHistory days={days} area="kyushu" date="2026-02-01" slot={1} onPick={vi.fn()} />)
  const heat = screen.getByRole('slider', { name: '価格の推移' })
  expect(heat).toHaveAttribute(
    'aria-valuetext',
    expect.stringMatching(/^2026年2月1日\(日\) 00:00–00:30: \d+\.\d\d 円\/kWh$/),
  )
  expect([...heat.nextElementSibling!.children].map((m) => m.textContent)).toEqual(['2026年', '2月'])
})

test('nothing without a priced day', () => {
  const { container } = render(<PriceHistory days={[]} area={null} date={null} slot={1} onPick={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
