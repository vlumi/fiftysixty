import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import PriceChart from './PriceChart'

/** A split day: Hokkaido, Tokyo and the west each cleared apart from the system price overnight. */
const day = parseSpot(csv).get('2026-09-22')!

const titles = (chart: HTMLElement) => [...chart.querySelectorAll('path > title')].map((t) => t.textContent)

test('with nothing picked, every area over the system price, the halves told apart in the key', () => {
  render(<PriceChart day={day} area={null} slot={1} onSlot={vi.fn()} />)
  const chart = screen.getByRole('slider', { name: 'Price over the day' })
  expect(chart).toHaveAttribute('aria-valuenow', '1')
  expect(chart).toHaveAttribute('aria-valuetext', '00:00–00:30')
  expect(titles(chart)).toEqual([
    'Hokkaido',
    'Tohoku',
    'Tokyo',
    'Chubu',
    'Hokuriku',
    'Kansai',
    'Chugoku',
    'Shikoku',
    'Kyushu',
    'System price',
  ])
  expect(chart.parentElement!.querySelector('figcaption')).toHaveTextContent('50 Hz60 HzSystem price')
  expect(screen.getByText('18')).toBeInTheDocument()
})

test('a picked area’s price over the system price, the axis fitted to the two', () => {
  // Tokyo touched 50.01 that evening while the system price stayed under 30.
  render(<PriceChart day={day} area="tokyo" slot={25} onSlot={vi.fn()} hours={false} />)
  const chart = screen.getByRole('slider', { name: 'Price over the day' })
  expect(titles(chart)).toEqual(['Tokyo', 'System price'])
  expect([...chart.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['¥0', '¥20', '¥40', '¥60'])
  expect(chart.parentElement!.querySelector('figcaption')).toHaveTextContent('TokyoSystem price')
  expect(screen.queryByText('18')).not.toBeInTheDocument()
})

test('a pointer picks the half hour by position', () => {
  const onSlot = vi.fn()
  render(<PriceChart day={day} area={null} slot={1} onSlot={onSlot} />)
  const chart = screen.getByRole('slider', { name: 'Price over the day' })
  chart.getBoundingClientRect = () => ({ left: 0, width: 320 }) as DOMRect
  chart.setPointerCapture = vi.fn()
  fireEvent.pointerDown(chart, { clientX: 319, pointerId: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(48)
  fireEvent.pointerMove(chart, { clientX: 5, buttons: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(1)
})
