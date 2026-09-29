import { areaList } from './names'

test('the areas as a list in either language', () => {
  expect(areaList(['hokkaido'], 'en')).toBe('Hokkaido')
  expect(areaList(['hokkaido', 'chubu'], 'en')).toBe('Hokkaido and Chubu')
  expect(areaList(['hokkaido', 'chubu', 'kyushu'], 'en')).toBe('Hokkaido, Chubu, and Kyushu')
  expect(areaList(['hokkaido', 'chubu'], 'ja')).toBe('北海道・中部')
})
