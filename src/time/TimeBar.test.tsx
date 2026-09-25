import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeBar from './TimeBar'

const days = ['2026-09-22', '2026-09-25', '2026-09-26']
const now = new Date('2026-09-26T10:10:00+09:00')

test('the slot reads as its half hour and scrubbing reports the new slot', () => {
  const onSlot = vi.fn()
  render(<TimeBar date="2026-09-26" days={days} slot={25} now={now} onDate={vi.fn()} onSlot={onSlot} />)
  expect(screen.getByRole('status')).toHaveTextContent('Today 12:00–12:30 JST · ahead')
  fireEvent.change(screen.getByRole('slider', { name: 'Half hour' }), { target: { value: '48' } })
  expect(onSlot).toHaveBeenCalledWith(48)
})

test('the day picker spans the days there are prices for', () => {
  const onDate = vi.fn()
  render(<TimeBar date="2026-09-26" days={days} slot={1} now={now} onDate={onDate} onSlot={vi.fn()} />)
  const picker = screen.getByLabelText('Delivery day')
  expect(picker).toHaveAttribute('min', '2026-09-22')
  expect(picker).toHaveAttribute('max', '2026-09-26')
  fireEvent.change(picker, { target: { value: '2026-09-25' } })
  expect(onDate).toHaveBeenCalledWith('2026-09-25')
})

test('before the data arrives the picker is disabled', () => {
  render(<TimeBar date={null} days={[]} slot={1} now={now} onDate={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByLabelText('Delivery day')).toBeDisabled()
})

test('the day steps to the priced day before and after, and stops at the ends', async () => {
  const onDate = vi.fn()
  const { rerender } = render(
    <TimeBar date="2026-09-25" days={days} slot={1} now={now} onDate={onDate} onSlot={vi.fn()} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-22')
  await userEvent.click(screen.getByRole('button', { name: 'Next day' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-26')
  rerender(<TimeBar date="2026-09-26" days={days} slot={1} now={now} onDate={onDate} onSlot={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Previous day' })).toBeEnabled()
})

test('today is a jump away, and its half hours read as past, now or ahead', async () => {
  const onDate = vi.fn()
  const { rerender } = render(
    <TimeBar date="2026-09-25" days={days} slot={21} now={now} onDate={onDate} onSlot={vi.fn()} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Today' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-26')
  rerender(<TimeBar date="2026-09-26" days={days} slot={21} now={now} onDate={onDate} onSlot={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Today 10:00–10:30 JST · now')
  rerender(<TimeBar date="2026-09-26" days={days} slot={30} now={now} onDate={onDate} onSlot={vi.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent('Today 14:30–15:00 JST · ahead')
})
