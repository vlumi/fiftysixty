import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/tepco-jukyu.csv?raw'
import { dayTotals } from '../market/daily'
import { TEPCO } from '../market/tepco'
import MonthStrip from './MonthStrip'

const day = dayTotals(TEPCO.parse(csv).get('2026-09-24')!)
const half = {
  ...day,
  generatedMWh: day.generatedMWh / 2,
  storageOutMWh: day.storageOutMWh / 2,
  demandMWh: day.demandMWh / 2,
}

test('a bar a day, as tall as its supply against the month’s most, the displayed day marked; it scrubs', async () => {
  const onPick = vi.fn()
  render(
    <MonthStrip
      days={[
        { date: '2026-09-23', totals: half },
        { date: '2026-09-24', totals: day },
      ]}
      date="2026-09-24"
      onPick={onPick}
    />,
  )
  expect(screen.getByRole('heading', { name: 'September 2026' })).toBeInTheDocument()
  const strip = screen.getByRole('slider', { name: 'September 2026' })
  expect(strip).toHaveAttribute('aria-valuenow', '2')
  expect(strip).toHaveAttribute('aria-valuetext', expect.stringMatching(/^2026-09-24 \(Thu\): \d+ GWh$/))
  const [a, b] = [...strip.children] as HTMLElement[]
  expect(b).toHaveAttribute('aria-current', 'date')
  expect((a.firstChild as HTMLElement).style.height).toBe('50%')
  expect((b.firstChild as HTMLElement).style.height).toBe('100%')
  fireEvent.keyDown(strip, { key: 'ArrowLeft' })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-23')
  strip.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect
  strip.setPointerCapture = vi.fn()
  fireEvent.pointerDown(strip, { clientX: 20, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-23')
  onPick.mockClear()
  fireEvent.pointerMove(strip, { clientX: 190, buttons: 1 })
  expect(onPick).not.toHaveBeenCalled()
})

test('a single day is no month to compare', () => {
  const { container } = render(<MonthStrip days={[{ date: '2026-09-24', totals: day }]} date={null} onPick={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
