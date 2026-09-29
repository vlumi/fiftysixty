import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../test/fixtures/tepco-jukyu.csv?raw'
import flowsCsv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, parseFlows } from '../market/flows'
import { planned } from '../market/interchange'
import { parseSpot, slotOf } from '../market/jepx'
import { recordSlot } from '../market/record'
import { TEPCO } from '../market/tepco'
import Readout from './Readout'

const slot = slotOf(parseSpot(csv), '2026-09-26', 47)!
const days = TEPCO.parse(tepcoCsv)
const record = recordSlot(days, '2026-09-24', 25)
const day = days.get('2026-09-24')!
const noon = planned(flowsAt(parseFlows(flowsCsv), '2026-09-23', 24))

test('without an area, the system price and the range across the areas', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      interchange={null}
      area={null}
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText('14.12')).toBeInTheDocument()
  expect(screen.getByText(/Areas from 10.04 to 22.02/)).toBeInTheDocument()
})

test('a picked area against the system price and its neighbors', async () => {
  const onBack = vi.fn()
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      interchange={null}
      area="tokyo"
      onBack={onBack}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('22.02', { selector: 'p' })).toBeInTheDocument()
  const rows = screen.getAllByRole('definition').map((d) => d.textContent)
  expect(rows).toEqual(['14.12 −7.90', '10.45 −11.57', '22.02 ±0.00'])
  expect(screen.getByText('No record for this half hour yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(onBack).toHaveBeenCalled()
})

test('Okinawa has no price to show', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      interchange={null}
      area="okinawa"
      onBack={vi.fn()}
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
      interchange={null}
      area={null}
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(container).toBeEmptyDOMElement()
})

test("what ran in a picked area is the chart's key with the half hour's figures, read top down as the chart stacks", () => {
  render(
    <Readout slot={slot} record={record} day={day} interchange={null} area="tokyo" onBack={vi.fn()} onSlot={vi.fn()} />,
  )
  const mix = screen.getByRole('region', { name: 'What ran' })
  const rows = within(mix)
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getByRole('rowheader').textContent)
  expect(rows).toEqual([
    'Demand',
    'Imports',
    'From storage',
    'Hydro',
    'Gas',
    'Wind',
    'Solar',
    'Oil and other',
    'Geothermal and biomass',
    'Nuclear',
    'Coal',
    'Into storage',
    'Exports',
  ])
  expect(within(mix).getByRole('row', { name: /^Demand/ })).toHaveTextContent(/\d{2},\d{3}/)
  expect(screen.getByRole('slider', { name: 'Supply over the day' })).toHaveAttribute('aria-valuenow', '47')
  expect(screen.queryByText('No record for this half hour yet.')).not.toBeInTheDocument()
})

test("a picked area's lines in or out against the limit, and its loop as the total across its two lines, marked as OCCTO's plan", () => {
  const at = slotOf(parseSpot(csv), '2026-09-23', 24)!
  render(
    <Readout
      slot={at}
      record={undefined}
      day={undefined}
      interchange={noon}
      area="kansai"
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  const lines = screen.getByRole('region', { name: 'Lines' })
  const names = [...lines.querySelectorAll('dt')].map((d) => d.textContent?.trim())
  expect(lines).toHaveTextContent('Lines · OCCTO plan')
  expect(names).toEqual(['Kansai–Chugoku split', 'Anan–Kihoku split', 'Chubu and Hokuriku'])
  const values = [...lines.querySelectorAll('dd')].map((d) => d.textContent)
  expect(values).toEqual(['in 3,290 of 3,290', 'in 550 of 550', 'out 1,290'])
})

test('a picked plant: its capacity and fuel, and that its output is not public', () => {
  render(
    <Readout
      slot={slot}
      record={undefined}
      day={undefined}
      interchange={null}
      area={null}
      plant={{ id: 'way/1', name: 'Kashiwazaki-Kariwa Nuclear Power Plant', fuel: 'nuclear', mw: 8212 }}
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Kashiwazaki-Kariwa Nuclear Power Plant' })).toBeInTheDocument()
  expect(screen.getByText('8,212')).toBeInTheDocument()
  expect(screen.getByText('Nuclear').className).toMatch(/pill/)
  expect(screen.getByText('Nuclear').className).toMatch(/nuclear/)
  expect(screen.getByText('Capacity as mapped in OpenStreetMap; what it runs is not public.')).toBeInTheDocument()
})

test('on a phone a picked area opens on its headline, the rest a tap on the row away', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(
    <Readout slot={slot} record={record} day={day} interchange={null} area="tokyo" onBack={vi.fn()} onSlot={vi.fn()} />,
  )
  const row = screen.getByRole('button', { expanded: false })
  expect(row).toHaveTextContent('Tokyo 50 Hz')
  expect(screen.queryByText('Tohoku')).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'What ran' })).not.toBeInTheDocument()
  await userEvent.click(row)
  expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
  expect(screen.getByText('Tohoku')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'What ran' })).toBeInTheDocument()
  vi.unstubAllGlobals()
})

test("the day view: the switch shows the area's day in energy, and all Japan with none picked", async () => {
  const { dayTotals } = await import('../market/daily')
  const totals = dayTotals(day)
  const { rerender } = render(
    <Readout
      slot={slot}
      record={record}
      day={day}
      interchange={null}
      area="tokyo"
      dayTotals={totals}
      dayPrice={12.34}
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Day' }))
  const supply = screen.getByRole('region', { name: 'How the day was supplied' })
  expect(within(supply).getByRole('row', { name: /^Nuclear/ })).toHaveTextContent(/\d+\.\d\d+%/)
  expect(supply).toHaveTextContent('Price, weighted by demand12.34')
  expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
  rerender(
    <Readout
      slot={slot}
      record={record}
      day={day}
      interchange={null}
      area={null}
      dayTotals={null}
      onBack={vi.fn()}
      onSlot={vi.fn()}
    />,
  )
  expect(screen.getByRole('heading', { name: 'All Japan' })).toBeInTheDocument()
  expect(screen.getByText('Not every area has recorded the whole day yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Half hour' }))
})
