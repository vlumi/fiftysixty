import { render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import AuctionChart from './AuctionChart'

/** A day with more than half again offered than asked at noon, when the west fell to the floor. */
const day = parseSpot(csv).get('2026-09-22')!

test('offered, asked and cleared as three lines over a gigawatt axis, the half hour’s figures in the key', () => {
  render(<AuctionChart day={day} slot={24} onSlot={vi.fn()} />)
  const chart = screen.getByRole('slider', { name: 'Auction over the day' })
  expect(chart).toHaveAttribute('aria-valuetext', '11:30–12:00')
  expect([...chart.querySelectorAll('path > title')].map((t) => t.textContent)).toEqual(['Offered', 'Asked', 'Cleared'])
  // The most offered that day was over 80 GW, so the axis runs to 100 in twenties, the unit on the zero label alone.
  expect([...chart.querySelectorAll('text')].map((t) => t.textContent)).toEqual([
    '0 GW',
    '20',
    '40',
    '60',
    '80',
    '100',
    '0',
    '6',
    '12',
    '18',
    '24',
  ])
  const at = day[23]
  const figure = (kwh: number) => `${((kwh * 2) / 1e6).toFixed(1)} GW`
  expect(chart.parentElement!.querySelector('figcaption')).toHaveTextContent(
    `Offered${figure(at.sellKWh)}Asked${figure(at.buyKWh)}Cleared${figure(at.volumeKWh)}`,
  )
})

test('without the hours when the supply chart follows', () => {
  render(<AuctionChart day={day} slot={1} onSlot={vi.fn()} hours={false} />)
  expect(screen.queryByText('18')).not.toBeInTheDocument()
})
