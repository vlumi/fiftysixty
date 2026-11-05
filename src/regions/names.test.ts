import { OCCTO_LINES } from './interconnectors'
import { areaList, areaName, lineName } from './names'

test('an area and a line by name in either language', () => {
  expect(areaName('kansai', 'en')).toBe('Kansai')
  expect(areaName('kansai', 'ja')).toBe('関西')
  expect(lineName(OCCTO_LINES[0], 'en')).toBe('Kitahon')
  expect(lineName(OCCTO_LINES[0], 'ja')).toBe('北海道・本州間電力連系設備')
})

test('the areas as a list in either language', () => {
  expect(areaList(['hokkaido'], 'en')).toBe('Hokkaido')
  expect(areaList(['hokkaido', 'chubu'], 'en')).toBe('Hokkaido and Chubu')
  expect(areaList(['hokkaido', 'chubu', 'kyushu'], 'en')).toBe('Hokkaido, Chubu, and Kyushu')
  expect(areaList(['hokkaido', 'chubu'], 'ja')).toBe('北海道・中部')
})
