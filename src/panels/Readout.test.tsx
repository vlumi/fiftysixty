import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import flowsCsv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { parseSpot, slotOf } from '../market/jepx'
import { recordSlot } from '../market/record'
import { TEPCO } from '../market/tepco'
import Readout from './Readout'

const slot = slotOf(parseSpot(csv), '2026-09-26', 47)!
const days = TEPCO.parse(tepcoCsv)
const record = recordSlot(days, '2026-09-24', 25)
const day = days.get('2026-09-24')!
const noon = flowsAt(parseFlows(flowsCsv), '2026-09-23', 24)
const none = new Map()

test('without an area, the system price and the range across the areas', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      flows={none}
      area={null}
      onClose={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText('14.12')).toBeInTheDocument()
  expect(screen.getByText(/Areas from 10.04 to 22.02/)).toBeInTheDocument()
})

test('a picked area against the system price and its neighbors', async () => {
  const onClose = vi.fn()
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      flows={none}
      area="tokyo"
      onClose={onClose}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('22.02', { selector: 'p' })).toBeInTheDocument()
  const rows = screen.getAllByRole('definition').map((d) => d.textContent)
  expect(rows).toEqual(['14.12 −7.90', '10.45 −11.57', '22.02 ±0.00'])
  expect(screen.getByText('No record for this half hour yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

test('Okinawa has no price to show', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      flows={none}
      area="okinawa"
      onClose={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByText(/Okinawa is not on the exchange/)).toBeInTheDocument()
})

test('nothing before the prices arrive', () => {
  const { container } = render(
    <Readout
      slot={undefined}
      record={undefined}
      day={undefined}
      flows={none}
      area={null}
      onClose={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(container).toBeEmptyDOMElement()
})

test('what ran in a picked area, the idle sources left out and the pumping negative', () => {
  render(<Readout slot={slot} record={record} day={day} flows={none} area="tokyo" onClose={vi.fn()} onSlot={vi.fn()} />)
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

test("a picked area's lines: flow in or out against the limit, and where the market split", () => {
  const at = slotOf(parseSpot(csv), '2026-09-23', 24)!
  render(
    <Readout
      slot={at}
      record={undefined}
      day={undefined}
      flows={noon}
      area="kansai"
      onClose={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  const lines = screen.getByRole('region', { name: 'Lines' })
  const names = [...lines.querySelectorAll('dt')].map((d) => d.textContent?.trim())
  expect(names).toEqual(['Kansai fence', 'Kansai–Chugoku split', 'Anan–Kihoku split'])
  const values = [...lines.querySelectorAll('dd')].map((d) => d.textContent)
  expect(values).toEqual(['out 1,290 of 1,830', 'in 6,580 of 6,580', 'in 550 of 550'])
})

test('a picked plant: its capacity and fuel, and that its output is not public', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      flows={none}
      area={null}
      plant={{ id: 'way/1', name: 'Kashiwazaki-Kariwa Nuclear Power Plant', fuel: 'nuclear', mw: 8212 }}
      onClose={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Kashiwazaki-Kariwa Nuclear Power Plant' })).toBeInTheDocument()
  expect(screen.getByText('8,212')).toBeInTheDocument()
  expect(
    screen.getByText(/Nuclear\. Capacity as mapped in OpenStreetMap; what it runs is not public\./),
  ).toBeInTheDocument()
})

test('on a phone a picked area opens on its headline, the rest a tap away', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<Readout slot={slot} record={record} day={day} flows={none} area="tokyo" onClose={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.queryByText('Tohoku')).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'What ran' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'More' }))
  expect(screen.getByText('Tohoku')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'What ran' })).toBeInTheDocument()
  vi.unstubAllGlobals()
})
