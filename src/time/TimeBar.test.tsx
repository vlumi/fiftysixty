import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useApp } from '../store'
import TimeBar from './TimeBar'

const days = ['2026-09-22', '2026-09-23', '2026-09-25', '2026-09-26']
const now = new Date('2026-09-26T10:10:00+09:00')

test('the slot reads as its half hour and scrubbing reports the new slot', () => {
  const onSlot = vi.fn()
  render(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={25}
      now={now}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={onSlot}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Today 12:00–12:30 JST · ahead')
  fireEvent.change(screen.getByRole('slider', { name: 'Half hour' }), { target: { value: '48' } })
  expect(onSlot).toHaveBeenCalledWith(48)
})

test('the day picker spans the days there are prices for', () => {
  const onDate = vi.fn()
  render(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  const picker = screen.getByLabelText('Delivery day')
  expect(picker).toHaveAttribute('min', '2026-09-22')
  expect(picker).toHaveAttribute('max', '2026-09-26')
  fireEvent.change(picker, { target: { value: '2026-09-25' } })
  expect(onDate).toHaveBeenCalledWith('2026-09-25')
  fireEvent.change(picker, { target: { value: '2026-09-24' } })
  expect(onDate).not.toHaveBeenCalledWith('2026-09-24')
})

test('before the data arrives the picker is disabled', () => {
  render(
    <TimeBar
      date={null}
      days={[]}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByLabelText('Delivery day')).toBeDisabled()
})

test('the day steps to the priced day before and after, and stops at the ends', async () => {
  const onDate = vi.fn()
  const { rerender } = render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-23')
  await userEvent.click(screen.getByRole('button', { name: 'Next day' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-26')
  rerender(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Previous day' })).toBeEnabled()
})

test('the half hour under way is a jump away, and today reads as past, now or ahead', async () => {
  const onDate = vi.fn()
  const onSlot = vi.fn()
  const { rerender } = render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={30}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={onSlot}
      onPlay={vi.fn()}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Now' }))
  expect(onDate).toHaveBeenLastCalledWith('2026-09-26')
  expect(onSlot).toHaveBeenLastCalledWith(21)
  rerender(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={21}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Now' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Today 10:00–10:30 JST · now')
  rerender(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={30}
      now={now}
      playing={false}
      stories={[]}
      onDate={onDate}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Today 14:30–15:00 JST · ahead')
})

test('tomorrow says only tomorrow: the whole day is ahead', () => {
  const tomorrow = new Date('2026-09-25T10:10:00+09:00')
  render(
    <TimeBar
      date="2026-09-26"
      days={days}
      slot={30}
      now={tomorrow}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(/^Tomorrow 14:30–15:00 JST$/)
})

test('play and pause', async () => {
  const onPlay = vi.fn()
  const { rerender } = render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={onPlay}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Play' }))
  expect(onPlay).toHaveBeenCalled()
  rerender(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={1}
      now={now}
      playing={true}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={onPlay}
    />,
  )
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
})

test('a story day is a jump away', async () => {
  const onDate = vi.fn()
  const onSlot = vi.fn()
  const story = { id: 'summer' as const, date: '2026-09-23', slot: 34, value: 50.01 }
  render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[story]}
      onDate={onDate}
      onSlot={onSlot}
      onPlay={vi.fn()}
    />,
  )
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Jump to' }), 'summer')
  expect(onDate).toHaveBeenCalledWith('2026-09-23')
  expect(onSlot).toHaveBeenCalledWith(34)
})

test('in Japanese the words follow', () => {
  useApp.getState().setLang('ja')
  render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={25}
      now={now}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('昨日 12:00–12:30 JST')
  expect(screen.getByRole('button', { name: '今' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '2026年9月25日(金)' })).toBeInTheDocument()
  useApp.getState().setLang('en')
})

test('the day reads in words with its weekday, over the picker', () => {
  render(
    <TimeBar
      date="2026-09-25"
      days={days}
      slot={1}
      now={now}
      playing={false}
      stories={[]}
      onDate={vi.fn()}
      onSlot={vi.fn()}
      onPlay={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Fri, 25 Sept 2026' })).toBeInTheDocument()
  expect(screen.getByLabelText('Delivery day')).toHaveValue('2026-09-25')
})
