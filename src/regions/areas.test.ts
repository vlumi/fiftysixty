import { AREAS, areasOf, PREFECTURES, PRICED_AREA_IDS, PRICED_AREAS, pricedArea } from './areas'

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
  expect(areasOf(50)).toEqual(['hokkaido', 'tohoku', 'tokyo'])
  expect(areasOf(60)).toEqual(['chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu'])
  expect(areasOf(null)).toBe(PRICED_AREA_IDS)
})

test('an area as a priced one, or none for Okinawa', () => {
  expect(pricedArea('tokyo')).toBe('tokyo')
  expect(pricedArea('okinawa')).toBeNull()
  expect(pricedArea(null)).toBeNull()
})
