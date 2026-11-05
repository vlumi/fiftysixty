import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import csv from '../../test/fixtures/jepx-spot.csv?raw'
import tepcoCsv from '../../test/fixtures/tepco-jukyu.csv?raw'
import flowsCsv from '../../test/fixtures/occto-renkei.csv?raw'
import { dayTotals, japanDay } from '../../market/daily'
import { flowsAt, parseFlows } from '../../market/flows'
import { priceHistory } from '../../market/history'
import { planned } from '../../market/interchange'
import { parseSpot, slotOf } from '../../market/jepx'
import { recordSlot } from '../../market/record'
import { TEPCO } from '../../market/tepco'
import { SHORT_QUERY } from '../../shared/useShort'
import { resetApp, useApp } from '../../store'
import Readout from './Readout'

const spot = parseSpot(csv)
const slot = slotOf(spot, '2026-09-26', 47)!
const spotDay = spot.get('2026-09-26')!
const days = TEPCO.parse(tepcoCsv)
const record = recordSlot(days, '2026-09-24', 25)
const day = days.get('2026-09-24')!
const noon = planned(flowsAt(parseFlows(flowsCsv), '2026-09-23', 24))
const holiday = slotOf(spot, '2026-09-23', 24)!

/** Nothing picked and nothing loaded but the half hour's prices. */
const base: ComponentProps<typeof Readout> = {
  slot,
  area: null,
  plant: null,
  record: undefined,
  recordDay: undefined,
  interchange: null,
  spotDay: undefined,
  scoped: { slots: [], missing: [] },
  dayTotals: null,
  dayPrice: null,
  monthDays: [],
  monthPrices: [],
  history: [],
  date: null,
  onDate: vi.fn(),
  onBack: vi.fn(),
  onSlot: vi.fn(),
}

afterEach(resetApp)

test('without an area, the system price and the range across the areas', () => {
  render(<Readout {...base} />)
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText('14.12')).toBeInTheDocument()
  expect(screen.getByText(/Areas from 10.04 to 22.02/)).toBeInTheDocument()
})

test('a picked area against the system price and its neighbors', async () => {
  const onBack = vi.fn()
  render(<Readout {...base} area="tokyo" onBack={onBack} />)
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('22.02', { selector: 'p' })).toBeInTheDocument()
  const rows = screen.getAllByRole('definition').map((d) => d.textContent)
  expect(rows).toEqual(['14.12 −7.90', '10.45 −11.57', '22.02 ±0.00'])
  expect(screen.getByText('No record for this half hour yet.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(onBack).toHaveBeenCalled()
})

test('the day’s price curve above the supply chart, for an area, and over the auction for all Japan, the hours once', () => {
  const { rerender } = render(<Readout {...base} record={record} recordDay={day} spotDay={spotDay} area="tokyo" />)
  const sliders = () => screen.getAllByRole('slider').map((c) => c.getAttribute('aria-label'))
  expect(sliders()).toEqual(['Price over the day', 'Supply over the day'])
  expect(screen.getAllByText('18')).toHaveLength(1)
  rerender(<Readout {...base} spotDay={spotDay} />)
  expect(sliders()).toEqual(['Price over the day', 'Auction over the day'])
  expect(screen.getAllByText('18')).toHaveLength(1)
})

test('a half of the grid from its toggle: its spread as the headline, the system price noted, and its areas summed under its name', async () => {
  const east = japanDay(new Map([['tokyo', day]]), ['hokkaido', 'tohoku', 'tokyo'])
  const { rerender } = render(<Readout {...base} spotDay={spotDay} scoped={east} />)
  expect(screen.getByRole('button', { name: 'All Japan' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: '50 Hz' }))
  expect(useApp.getState().half).toBe(50)
  expect(screen.getByRole('button', { name: 'All Japan' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('heading', { name: '50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('10.45–22.02', { selector: 'p' })).toBeInTheDocument()
  // The system price, then each of the half's areas against it, before the supply key's figures.
  expect(
    screen
      .getAllByRole('definition')
      .slice(0, 4)
      .map((d) => d.textContent),
  ).toEqual(['14.12', '10.45 −3.67', '10.45 −3.67', '22.02 +7.90'])
  expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
    '50 Hz · without Hokkaido and Tohoku, not recorded yet',
  )
  expect(screen.getByRole('button', { name: '50 Hz' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'All Japan' }))
  expect(useApp.getState().half).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: '50 Hz' }))
  // The toggle is not for a picked area, which is in one half already.
  rerender(<Readout {...base} spotDay={spotDay} area="tokyo" />)
  expect(screen.queryByRole('button', { name: '50 Hz' })).not.toBeInTheDocument()
})

test("a half's day: its figures from JEPX's prices under its name with the areas not yet recorded", async () => {
  useApp.getState().setHalf(50)
  const east = japanDay(new Map([['tokyo', day]]), ['hokkaido', 'tohoku', 'tokyo'])
  render(<Readout {...base} spotDay={spotDay} scoped={east} dayTotals={dayTotals(east.slots)} dayPrice={9.5} />)
  await userEvent.click(screen.getByRole('button', { name: 'Day' }))
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
    '50 Hz · without Hokkaido and Tohoku, not recorded yet',
  ])
  const prices = screen.getByRole('region', { name: 'Prices' })
  expect(within(prices).getByText('Price, weighted by demand').nextElementSibling).toHaveTextContent('9.50')
  expect(within(prices).queryByText('Mean price')).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'How the day was supplied' })).toBeInTheDocument()
})

test('Okinawa has no price to show, whichever view the switch was left on', () => {
  useApp.getState().setView('day')
  render(<Readout {...base} area="okinawa" dayTotals={dayTotals(day)} />)
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText(/Okinawa is not on the exchange/)).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'View' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'All Japan' })).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'How the day was supplied' })).not.toBeInTheDocument()
})

test('nothing before the prices arrive', () => {
  const { container } = render(<Readout {...base} slot={undefined} />)
  expect(container).toBeEmptyDOMElement()
})

test("what ran in a picked area is the chart's key with the half hour's figures, read top down as the chart stacks", () => {
  render(<Readout {...base} record={record} recordDay={day} area="tokyo" />)
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
  render(<Readout {...base} slot={holiday} interchange={noon} area="kansai" />)
  const lines = screen.getByRole('region', { name: 'Lines' })
  const names = [...lines.querySelectorAll('dt')].map((d) => d.textContent?.trim())
  expect(lines).toHaveTextContent('Lines · OCCTO plan')
  expect(names).toEqual(['Kansai–Chugoku split', 'Anan–Kihoku split', 'Chubu and Hokuriku'])
  const values = [...lines.querySelectorAll('dd')].map((d) => d.textContent)
  expect(values).toEqual(['in 3,290 of 3,290', 'in 550 of 550', 'out 1,290'])
})

test("a half's lines are the frequency converters alone, in or out of the half against their limit", () => {
  useApp.getState().setHalf(50)
  const { rerender } = render(<Readout {...base} slot={holiday} interchange={noon} />)
  const rows = () => {
    const lines = screen.getByRole('region', { name: 'Lines' })
    return [...lines.querySelectorAll('dt, dd')].map((d) => d.textContent?.trim())
  }
  expect(rows()).toEqual(['Frequency converters', 'in 256 of 1,800'])
  useApp.getState().setHalf(60)
  rerender(<Readout {...base} slot={holiday} interchange={noon} />)
  expect(rows()).toEqual(['Frequency converters', 'out 256 of 1,800'])
})

test('the switches stay with the headline, pinned above the body that scrolls', () => {
  render(<Readout {...base} />)
  const pinned = screen.getByRole('group', { name: 'View' }).parentElement!.parentElement!
  expect(pinned).toContainElement(screen.getByRole('heading', { name: 'System price' }))
  expect(pinned).not.toContainElement(screen.getByText(/Pick an area for its price/))
})

test('on a short screen the switches scroll with the body, so the content keeps the room', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === SHORT_QUERY,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  render(<Readout {...base} />)
  const group = screen.getByRole('group', { name: 'View' })
  expect(group.parentElement).not.toContainElement(screen.getByRole('heading', { name: 'System price' }))
  expect(group.parentElement!.parentElement).toContainElement(screen.getByText(/Pick an area for its price/))
})

test('a picked plant: its capacity and fuel, and that its output is not public', () => {
  render(
    <Readout
      {...base}
      plant={{ id: 'way/1', name: 'Kashiwazaki-Kariwa Nuclear Power Plant', fuel: 'nuclear', mw: 8212 }}
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
  render(<Readout {...base} record={record} recordDay={day} area="tokyo" />)
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

test('on a phone choosing a half from inside the open panel leaves it open', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<Readout {...base} />)
  await userEvent.click(screen.getByRole('button', { expanded: false }))
  await userEvent.click(screen.getByRole('button', { name: '60 Hz' }))
  expect(screen.getByRole('button', { expanded: true })).toHaveTextContent('60 Hz')
  expect(screen.getByRole('button', { name: '60 Hz' })).toHaveAttribute('aria-pressed', 'true')
  vi.unstubAllGlobals()
})

test("the day view: the switch shows the area's day in energy, and all Japan with none picked", async () => {
  const { rerender } = render(
    <Readout
      {...base}
      record={record}
      recordDay={day}
      area="tokyo"
      dayTotals={dayTotals(day)}
      spotDay={spotDay}
      dayPrice={12.34}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Day' }))
  const supply = screen.getByRole('region', { name: 'How the day was supplied' })
  expect(within(supply).getByRole('row', { name: /^Nuclear/ })).toHaveTextContent(/\d+\.\d\d+%/)
  const prices = screen.getByRole('region', { name: 'Prices' })
  expect(within(prices).getByText('Price, weighted by demand').nextElementSibling).toHaveTextContent('12.34')
  expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
  rerender(<Readout {...base} record={record} recordDay={day} />)
  expect(screen.getByRole('heading', { name: 'All Japan' })).toBeInTheDocument()
  expect(screen.getByText('No area has recorded the day yet.')).toBeInTheDocument()
})

test('the history view: the heatmap over every priced day held, a press on it setting the day and the half hour', async () => {
  const onDate = vi.fn()
  const onSlot = vi.fn()
  render(<Readout {...base} history={priceHistory(spot)} date="2026-09-26" onDate={onDate} onSlot={onSlot} />)
  await userEvent.click(screen.getByRole('button', { name: 'History' }))
  const heat = screen.getByRole('slider', { name: 'Price history' })
  expect(heat).toHaveAttribute('aria-valuenow', '4')
  expect(heat).toHaveAttribute('aria-valuetext', '2026-09-26 (Sat) 23:00–23:30: 14.12 ¥/kWh')
  expect(screen.queryByRole('slider', { name: 'Price over the day' })).not.toBeInTheDocument()
  heat.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 96 }) as DOMRect
  heat.setPointerCapture = vi.fn()
  fireEvent.pointerDown(heat, { clientX: 10, clientY: 1, pointerId: 1 })
  expect(onDate).toHaveBeenCalledWith('2026-09-22')
  expect(onSlot).toHaveBeenCalledWith(1)
})
