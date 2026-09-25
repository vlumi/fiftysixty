import { clampSlot, slotRange } from './slots'

test('a slot is its half hour from midnight', () => {
  expect(slotRange(1)).toBe('00:00–00:30')
  expect(slotRange(25)).toBe('12:00–12:30')
  expect(slotRange(48)).toBe('23:30–00:00')
})

test('slots stay in 1 to 48', () => {
  expect(clampSlot(0)).toBe(1)
  expect(clampSlot(49)).toBe(48)
  expect(clampSlot(24.6)).toBe(25)
})
