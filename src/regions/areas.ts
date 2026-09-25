/** The nine JEPX areas plus Okinawa, which has neither a price nor an interconnector. */
export type Area =
  'hokkaido' | 'tohoku' | 'tokyo' | 'chubu' | 'hokuriku' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu' | 'okinawa'

export type Hz = 50 | 60

export interface AreaInfo {
  id: Area
  name: string
  /** The name as JEPX and the transmission companies write it, which is how the CSV columns are found. */
  ja: string
  hz: Hz
  /** JIS X 0401 prefecture codes; the areas follow the prefecture lines, see PREFECTURES. */
  prefectures: readonly number[]
}

/**
 * The supply areas on the prefecture lines. The real boundaries cut three prefectures: Shizuoka along
 * the Fuji river between Tokyo and Chubu, Nagano's Tokyo-fed corner, and Mie's Kansai-fed south; all
 * three are drawn whole in the area that holds most of them.
 */
export const AREAS: readonly AreaInfo[] = [
  { id: 'hokkaido', name: 'Hokkaido', ja: '北海道', hz: 50, prefectures: [1] },
  { id: 'tohoku', name: 'Tohoku', ja: '東北', hz: 50, prefectures: [2, 3, 4, 5, 6, 7, 15] },
  { id: 'tokyo', name: 'Tokyo', ja: '東京', hz: 50, prefectures: [8, 9, 10, 11, 12, 13, 14, 19] },
  { id: 'chubu', name: 'Chubu', ja: '中部', hz: 60, prefectures: [20, 21, 22, 23, 24] },
  { id: 'hokuriku', name: 'Hokuriku', ja: '北陸', hz: 60, prefectures: [16, 17, 18] },
  { id: 'kansai', name: 'Kansai', ja: '関西', hz: 60, prefectures: [25, 26, 27, 28, 29, 30] },
  { id: 'chugoku', name: 'Chugoku', ja: '中国', hz: 60, prefectures: [31, 32, 33, 34, 35] },
  { id: 'shikoku', name: 'Shikoku', ja: '四国', hz: 60, prefectures: [36, 37, 38, 39] },
  { id: 'kyushu', name: 'Kyushu', ja: '九州', hz: 60, prefectures: [40, 41, 42, 43, 44, 45, 46] },
  { id: 'okinawa', name: 'Okinawa', ja: '沖縄', hz: 60, prefectures: [47] },
]

/** The areas with a JEPX price, in JEPX's column order. */
export const PRICED_AREAS: readonly AreaInfo[] = AREAS.filter((a) => a.id !== 'okinawa')

export const AREA_BY_ID: Readonly<Record<Area, AreaInfo>> = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<
  Area,
  AreaInfo
>

/** The prefectures by JIS X 0401 code, as the geometry source labels them. */
export const PREFECTURES: Readonly<Record<number, string>> = {
  1: 'Hokkaido',
  2: 'Aomori',
  3: 'Iwate',
  4: 'Miyagi',
  5: 'Akita',
  6: 'Yamagata',
  7: 'Fukushima',
  8: 'Ibaraki',
  9: 'Tochigi',
  10: 'Gunma',
  11: 'Saitama',
  12: 'Chiba',
  13: 'Tokyo',
  14: 'Kanagawa',
  15: 'Niigata',
  16: 'Toyama',
  17: 'Ishikawa',
  18: 'Fukui',
  19: 'Yamanashi',
  20: 'Nagano',
  21: 'Gifu',
  22: 'Shizuoka',
  23: 'Aichi',
  24: 'Mie',
  25: 'Shiga',
  26: 'Kyoto',
  27: 'Osaka',
  28: 'Hyogo',
  29: 'Nara',
  30: 'Wakayama',
  31: 'Tottori',
  32: 'Shimane',
  33: 'Okayama',
  34: 'Hiroshima',
  35: 'Yamaguchi',
  36: 'Tokushima',
  37: 'Kagawa',
  38: 'Ehime',
  39: 'Kochi',
  40: 'Fukuoka',
  41: 'Saga',
  42: 'Nagasaki',
  43: 'Kumamoto',
  44: 'Oita',
  45: 'Miyazaki',
  46: 'Kagoshima',
  47: 'Okinawa',
}
