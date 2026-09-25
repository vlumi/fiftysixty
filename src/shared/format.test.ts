import { signed, yen } from './format'

test('prices and spreads', () => {
  expect(yen(9.5)).toBe('9.50')
  expect(signed(3.2)).toBe('+3.20')
  expect(signed(-1)).toBe('−1.00')
  expect(signed(0)).toBe('±0.00')
})
