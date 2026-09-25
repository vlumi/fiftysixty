import { AREAS, PREFECTURES, PRICED_AREAS } from './areas'

test('every prefecture belongs to exactly one area', () => {
  const assigned = AREAS.flatMap((a) => a.prefectures).sort((a, b) => a - b)
  expect(assigned).toEqual(Object.keys(PREFECTURES).map(Number))
  expect(assigned).toHaveLength(47)
})

test('the priced areas are the nine in the JEPX column order', () => {
  expect(PRICED_AREAS.map((a) => a.ja)).toEqual([
    '北海道',
    '東北',
    '東京',
    '中部',
    '北陸',
    '関西',
    '中国',
    '四国',
    '九州',
  ])
})

test('the east is 50 Hz and the west 60', () => {
  expect(AREAS.filter((a) => a.hz === 50).map((a) => a.id)).toEqual(['hokkaido', 'tohoku', 'tokyo'])
})
