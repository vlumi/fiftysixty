import { fireEvent, render, screen } from '@testing-library/react'
import TimeBar from './TimeBar'

const days = ['2026-09-25', '2026-09-26']

test('the slot reads as its half hour and scrubbing reports the new slot', () => {
  const onSlot = vi.fn()
  render(<TimeBar date="2026-09-26" days={days} slot={25} onDate={vi.fn()} onSlot={onSlot} />)
  expect(screen.getByRole('status')).toHaveTextContent('12:00–12:30 JST')
  fireEvent.change(screen.getByRole('slider', { name: 'Half hour' }), { target: { value: '48' } })
  expect(onSlot).toHaveBeenCalledWith(48)
})

test('the day picker spans the days there are prices for', () => {
  const onDate = vi.fn()
  render(<TimeBar date="2026-09-26" days={days} slot={1} onDate={onDate} onSlot={vi.fn()} />)
  const picker = screen.getByLabelText('Delivery day')
  expect(picker).toHaveAttribute('min', '2026-09-25')
  expect(picker).toHaveAttribute('max', '2026-09-26')
  fireEvent.change(picker, { target: { value: '2026-09-25' } })
  expect(onDate).toHaveBeenCalledWith('2026-09-25')
})

test('before the data arrives the picker is disabled', () => {
  render(<TimeBar date={null} days={[]} slot={1} onDate={vi.fn()} onSlot={vi.fn()} />)
  expect(screen.getByLabelText('Delivery day')).toBeDisabled()
})
