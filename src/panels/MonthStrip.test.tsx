import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

test('a bar a day, as tall as its supply against the month’s most, the displayed day marked, a tap to go there', async () => {
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
  const [a, b] = screen.getAllByRole('button')
  expect(a).toHaveAccessibleName(/^2026-09-23 \(Wed\): \d+ GWh$/)
  expect(b).toHaveAttribute('aria-current', 'date')
  expect((a.firstChild as HTMLElement).style.height).toBe('50%')
  expect((b.firstChild as HTMLElement).style.height).toBe('100%')
  await userEvent.click(a)
  expect(onPick).toHaveBeenCalledWith('2026-09-23')
})

test('a single day is no month to compare', () => {
  const { container } = render(<MonthStrip days={[{ date: '2026-09-24', totals: day }]} date={null} onPick={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
