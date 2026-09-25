import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { TEPCO } from '../market/tepco'
import SupplyChart from './SupplyChart'

const day = TEPCO.parse(csv).get('2026-09-24')!

test('eight bands, the exchange, the demand line and a legend, with the slot as the slider value', () => {
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
    'Storage and imports',
    'Pumping, charging and exports',
  ])
  expect(screen.getByText('Demand')).toBeInTheDocument()
  expect(screen.getByText('Sent out, below the line')).toBeInTheDocument()
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
  fireEvent.pointerDown(chart, { clientX: 470, pointerId: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(48)
  fireEvent.pointerMove(chart, { clientX: 5, buttons: 1 })
  expect(onSlot).toHaveBeenLastCalledWith(1)
})

test('curtailment gets its own hatched band and key', () => {
  const curtailed = day.map((r) => ({ ...r, curtailedMW: { solar: 500, wind: 0 } }))
  render(<SupplyChart day={curtailed} slot={1} onSlot={vi.fn()} />)
  expect(screen.getAllByText('Curtailed')).toHaveLength(2)
})
