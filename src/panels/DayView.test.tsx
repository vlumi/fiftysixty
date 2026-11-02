import { render, screen, within } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import { dayTotals } from '../market/daily'
import { parseSpot } from '../market/jepx'
import { TEPCO } from '../market/tepco'
import { DayPrices, DaySupply } from './DayView'

/** A split day: Tokyo touched 50.01 in the evening while Kansai spent the night at 8.40. */
const spot = parseSpot(csv).get('2026-09-22')!
const totals = dayTotals(TEPCO.parse(tepcoCsv).get('2026-09-24')!)

test('the price figures stand without a record: the mean, the low and the high with when', () => {
  render(
    <>
      <DayPrices spot={spot} area="tokyo" weighted={null} />
      <DaySupply totals={null} area="tokyo" />
    </>,
  )
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
  render(
    <>
      <DayPrices spot={floored} area={null} weighted={12.34} />
      <DaySupply totals={totals} area={null} />
    </>,
  )
  expect(screen.getByRole('region', { name: 'How the day was supplied' })).toBeInTheDocument()
  const prices = screen.getByRole('region', { name: 'Prices' })
  expect(within(prices).getByText('Price, weighted by demand').nextElementSibling).toHaveTextContent('12.34 ¥/kWh')
  expect(within(prices).getByText('Half hours at the floor').nextElementSibling).toHaveTextContent('3')
  expect(within(prices).getByText('Lowest price').nextElementSibling).toHaveTextContent('0.01 ¥/kWh · 00:00')
})

test("a half's prices are what JEPX's give: the spread across its areas with where and when, and the area half hours at the floor", () => {
  render(<DayPrices spot={spot} area={null} half={60} weighted={9.5} />)
  const rows = [...screen.getByRole('region', { name: 'Prices' }).querySelectorAll('dt')].map(
    (dt) => `${dt.textContent}: ${dt.nextElementSibling!.textContent}`,
  )
  expect(rows).toEqual([
    'Price, weighted by demand: 9.50 ¥/kWh',
    'Lowest price: 0.01 ¥/kWh · 08:30 Kyushu',
    'Highest price: 38.23 ¥/kWh · 17:30 Chubu',
    'Area half hours at the floor: 29',
  ])
  expect(screen.queryByText('Mean price')).not.toBeInTheDocument()
})
