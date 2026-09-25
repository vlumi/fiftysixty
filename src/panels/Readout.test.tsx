import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import { parseSpot, slotOf } from '../market/jepx'
import { recordSlot } from '../market/record'
import { TEPCO } from '../market/tepco'
import Readout from './Readout'

const slot = slotOf(parseSpot(csv), '2026-09-26', 47)!
const days = TEPCO.parse(tepcoCsv)
const record = recordSlot(days, '2026-09-24', 25)
const day = days.get('2026-09-24')!

test('without an area, the system price and the range across the areas', () => {
  render(<Readout slot={slot} record={undefined} day={undefined} area={null} onClose={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText('14.12')).toBeInTheDocument()
  expect(screen.getByText(/Areas from 10.04 to 22.02/)).toBeInTheDocument()
})

test('a picked area against the system price and its neighbors', async () => {
  const onClose = vi.fn()
  render(<Readout slot={slot} record={undefined} day={undefined} area="tokyo" onClose={onClose} onSlot={vi.fn()} />)
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('22.02', { selector: 'p' })).toBeInTheDocument()
  const rows = screen.getAllByRole('definition').map((d) => d.textContent)
  expect(rows).toEqual(['14.12 −7.90', '10.45 −11.57', '22.02 ±0.00'])
  expect(screen.getByText('No record for this half hour yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

test('Okinawa has no price to show', () => {
  render(<Readout slot={slot} record={undefined} day={undefined} area="okinawa" onClose={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByText(/Okinawa is not on the exchange/)).toBeInTheDocument()
})

test('nothing before the prices arrive', () => {
  const { container } = render(
    <Readout slot={undefined} record={undefined} day={undefined} area={null} onClose={vi.fn()} onSlot={vi.fn()} />,
  )
  expect(container).toBeEmptyDOMElement()
})

test('what ran in a picked area, the idle sources left out and the pumping negative', () => {
  render(<Readout slot={slot} record={record} day={day} area="tokyo" onClose={vi.fn()} onSlot={vi.fn()} />)
  const mix = screen.getByRole('region', { name: 'What ran' })
  expect(mix).toHaveTextContent('Demand 36,867 MW')
  const names = [...mix.querySelectorAll('dt')].map((d) => d.textContent)
  expect(names).toEqual([
    'Nuclear',
    'Gas',
    'Coal',
    'Oil',
    'Other thermal',
    'Hydro',
    'Biomass',
    'Solar',
    'Wind',
    'Pumped storage',
    'Interconnectors',
    'Other',
  ])
  expect(mix).toHaveTextContent('Pumped storage−2,260')
  expect(screen.getByRole('slider', { name: 'Supply over the day' })).toHaveAttribute('aria-valuenow', '47')
})

test('an area whose company is not wired says so', () => {
  render(<Readout slot={slot} record={undefined} day={undefined} area="kyushu" onClose={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByText('The record for Kyushu is not wired yet.')).toBeInTheDocument()
})
