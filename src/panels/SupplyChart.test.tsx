import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { TEPCO } from '../market/tepco'
import SupplyChart from './SupplyChart'

const day = TEPCO.parse(csv).get('2026-09-24')!

test('eight bands, storage and the lines apart above and below, the demand line and a key, with the slot as the slider value', () => {
  render(<SupplyChart day={day} slot={25} onSlot={vi.fn()} />)
  const chart = screen.getByRole('slider', { name: 'Supply over the day' })
  expect(chart).toHaveAttribute('aria-valuenow', '25')
  expect(chart).toHaveAttribute('aria-valuetext', '12:00–12:30')
  const titles = [...chart.querySelectorAll('path > title')].map((t) => t.textContent)
  expect(titles).toEqual([
    'Coal',
    'Nuclear',
    'Geothermal and biomass',
    'Oil and other',
    'Solar',
    'Wind',
    'Gas',
    'Hydro',
    'From storage',
    'Imports',
    'Into storage',
    'Exports',
  ])
  expect(screen.getByText('Demand')).toBeInTheDocument()
  expect(screen.getAllByText('Exports').length).toBeGreaterThan(0)
  expect(screen.queryByText('Curtailed')).not.toBeInTheDocument()
})

test('the arrow keys move the half hour and a pointer picks it by position', () => {
  const onSlot = vi.fn()
  render(<SupplyChart day={day} slot={25} onSlot={onSlot} />)
  const chart = screen.getByRole('slider', { name: 'Supply over the day' })
  fireEvent.keyDown(chart, { key: 'ArrowRight' })
  expect(onSlot).toHaveBeenLastCalledWith(26)
  fireEvent.keyDown(chart, { key: 'ArrowLeft' })
  expect(onSlot).toHaveBeenLastCalledWith(24)
  chart.getBoundingClientRect = () => ({ left: 0, width: 480 }) as DOMRect
  chart.setPointerCapture = vi.fn()
  fireEvent.pointerDown(chart, { clientX: 478, pointerId: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(48)
  fireEvent.pointerMove(chart, { clientX: 52, buttons: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(1)
  // The gutter left of the plot, where the labels sit, is the first half hour too.
  fireEvent.pointerMove(chart, { clientX: 5, buttons: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(1)
})

test('curtailment gets its own hatched band and key', () => {
  const curtailed = day.map((r) => ({ ...r, curtailedMW: { solar: 500, wind: 0 } }))
  render(<SupplyChart day={curtailed} slot={1} onSlot={vi.fn()} />)
  expect(screen.getAllByText('Curtailed')).toHaveLength(2)
})

test('an idle row reads 0, never a negative zero', () => {
  const idle = day.map((r) => ({ ...r, bySource: { ...r.bySource, pumped: 0, battery: 0, interconnector: 1000 } }))
  render(<SupplyChart day={idle} slot={25} onSlot={vi.fn()} />)
  for (const name of ['Into storage', 'Exports'])
    expect(screen.getByRole('row', { name: new RegExp(`^${name}`) })).toHaveTextContent(/^[^-]*0$/)
})
