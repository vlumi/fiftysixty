import { mapScale } from './scale'

test('full size at the desktop zoom, half a level out, capped a level and a half in, never below a third', () => {
  expect(mapScale(5)).toBe(1)
  expect(mapScale(4)).toBe(0.5)
  expect(mapScale(6)).toBe(1.5)
  expect(mapScale(9)).toBe(1.5)
  expect(mapScale(9, 1)).toBe(1)
  expect(mapScale(1)).toBe(0.3)
})
