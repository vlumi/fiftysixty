import type { Rgb } from './palette'
import { cssRgb, lerpRgb, PRICE_DOMAIN, priceColor, priceAxis } from './scale'

const ramp: Rgb[] = [
  [0, 0, 0],
  [100, 100, 100],
  [200, 200, 200],
]

test('the ends of the domain are the ends of the ramp, and beyond them is clamped', () => {
  expect(priceColor(PRICE_DOMAIN[0], ramp)).toEqual([0, 0, 0])
  expect(priceColor(PRICE_DOMAIN[1], ramp)).toEqual([200, 200, 200])
  expect(priceColor(-5, ramp)).toEqual([0, 0, 0])
  expect(priceColor(64.28, ramp)).toEqual([200, 200, 200])
  expect(priceColor(Number.NaN, ramp)).toEqual([0, 0, 0])
})

test('between stops the color is interpolated', () => {
  expect(priceColor(12.5, ramp)).toEqual([50, 50, 50])
  expect(priceColor(37.5, ramp)).toEqual([150, 150, 150])
})

test('a color as CSS', () => {
  expect(cssRgb([1, 2, 3])).toBe('rgb(1 2 3)')
})

test('a color between two', () => {
  expect(lerpRgb([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25])
})

test('the day chart’s axis: zero-based, about five gridlines, never under 20 yen', () => {
  expect(priceAxis(12)).toEqual({ top: 20, step: 5 })
  expect(priceAxis(28.41)).toEqual({ top: 30, step: 10 })
  expect(priceAxis(40.01)).toEqual({ top: 50, step: 10 })
  expect(priceAxis(63)).toEqual({ top: 80, step: 20 })
  expect(priceAxis(201)).toEqual({ top: 250, step: 50 })
})
