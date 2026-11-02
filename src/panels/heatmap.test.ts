import { DARK } from '../shared/palette'
import { priceColor } from '../shared/scale'
import { cellAt, heatmapPixels, labeled, monthStarts } from './heatmap'

const day = (date: string, price: number) => ({ date, prices: new Array<number>(48).fill(price) })
const ramp = DARK.price[50]
const at = (pixels: Uint8ClampedArray, width: number, x: number, row: number) => [
  ...pixels.slice((row * width + x) * 4, (row * width + x) * 4 + 4),
]

test('a column a day when they fit, its rows the day’s half hours in the ramp', () => {
  const days = [day('2026-09-22', 10), day('2026-09-23', 50)]
  const pixels = heatmapPixels(days, ramp, 4)
  expect(pixels).toHaveLength(4 * 48 * 4)
  expect(at(pixels, 4, 0, 0)).toEqual([...priceColor(10, ramp), 255])
  expect(at(pixels, 4, 1, 47)).toEqual([...priceColor(10, ramp), 255])
  expect(at(pixels, 4, 2, 0)).toEqual([...priceColor(50, ramp), 255])
  expect(at(pixels, 4, 3, 47)).toEqual([...priceColor(50, ramp), 255])
})

test('more days than columns: a column is the mean of its days, and a half hour without a price is clear', () => {
  const days = [day('2026-09-22', 10), day('2026-09-23', 30), day('2026-09-24', 50)]
  days[2].prices[5] = NaN
  const pixels = heatmapPixels(days, ramp, 2)
  expect(at(pixels, 2, 0, 0)).toEqual([...priceColor(10, ramp), 255])
  expect(at(pixels, 2, 1, 0)).toEqual([...priceColor(40, ramp), 255])
  expect(at(pixels, 2, 1, 5)).toEqual([...priceColor(30, ramp), 255])
  expect(at(heatmapPixels([day('2026-09-22', NaN)], ramp, 1), 1, 0, 0)).toEqual([0, 0, 0, 0])
})

test('the cell under a point, clamped to the plot', () => {
  expect(cellAt(0.1, 0.51, 4)).toEqual({ index: 0, slot: 25 })
  expect(cellAt(0.99, 0.01, 4)).toEqual({ index: 3, slot: 1 })
  expect(cellAt(1.2, 1.5, 4)).toEqual({ index: 3, slot: 48 })
  expect(cellAt(-0.2, -0.5, 4)).toEqual({ index: 0, slot: 1 })
})

test('the ticks where a month begins, and the labels spaced out', () => {
  const dates = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-02-01']
  expect(monthStarts(dates)).toEqual([0, 2, 4])
  expect(labeled([0, 2, 4], 3)).toEqual([0, 4])
  expect(labeled([0, 2, 4], 0)).toEqual([0, 2, 4])
  // A year is always labeled, and the months too near it give way.
  expect(labeled([0, 2, 4], 3, [2])).toEqual([2])
  expect(labeled([0, 2, 4, 6], 2, [2])).toEqual([0, 2, 4, 6])
})
