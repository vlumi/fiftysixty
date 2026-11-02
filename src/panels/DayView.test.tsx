import { render, screen, within } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import { dayTotals } from '../market/daily'
import { parseSpot } from '../market/jepx'
import { TEPCO } from '../market/tepco'
import DayView from './DayView'

/** A split day: Tokyo touched 50.01 in the evening while Kansai spent the night at 8.40. */
const spot = parseSpot(csv).get('2026-09-22')!
const totals = dayTotals(TEPCO.parse(tepcoCsv).get('2026-09-24')!)

test('the price figures stand without a record: the mean, the low and the high with when', () => {
  render(<DayView totals={null} price={null} spot={spot} area="tokyo" />)
  expect(screen.getByText('No record for this half hour yet.')).toBeInTheDocument()
  const prices = screen.getByRole('region', { name: 'Prices' })
  const rows = within(prices)
    .getAllByRole('term')
    .map((dt) => `${dt.textContent}: ${dt.nextElementSibling!.textContent}`)
  const mean = spot.reduce((sum, s) => sum + s.areaPrice.tokyo, 0) / spot.length
  expect(rows).toEqual([
    `Mean price: ${mean.toFixed(2)} ¥/kWh`,
    expect.stringMatching(/^Lowest price: \d+\.\d\d ¥\/kWh · \d\d:\d\d$/),
    'Highest price: 50.01 ¥/kWh · 16:30',
  ])
  expect(screen.queryByText('Price, weighted by demand')).not.toBeInTheDocument()
})

test('with the record, the supply and the weighted price too, and the half hours at the floor when there were any', () => {
  const floored = spot.map((s, i) => (i < 3 ? { ...s, systemPrice: 0.01 } : s))
  render(<DayView totals={totals} price={12.34} spot={floored} area={null} />)
  expect(screen.getByRole('region', { name: 'How the day was supplied' })).toBeInTheDocument()
  const prices = screen.getByRole('region', { name: 'Prices' })
  expect(within(prices).getByText('Price, weighted by demand').nextElementSibling).toHaveTextContent('12.34 ¥/kWh')
  expect(within(prices).getByText('Half hours at the floor').nextElementSibling).toHaveTextContent('3')
  expect(within(prices).getByText('Lowest price').nextElementSibling).toHaveTextContent('0.01 ¥/kWh · 00:00')
})
