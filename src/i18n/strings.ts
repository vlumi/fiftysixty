import type { Series } from '../market/stack'
import type { Source } from '../market/record'
import type { StoryId } from '../market/stories'

export type Lang = 'en' | 'ja'
export const LANGS: readonly Lang[] = ['en', 'ja']

/** Every visible word, by key, in each language; the layout never changes with the language, only the words. */
export interface Strings {
  subtitle: string
  theme: { toLight: string; toDark: string }
  language: { label: string; other: string }
  time: {
    day: string
    halfHour: string
    previousDay: string
    nextDay: string
    now: string
    jumpTo: string
    play: string
    pause: string
    yesterday: string
    today: string
    tomorrow: string
    daysAgo: (n: number) => string
    daysAhead: (n: number) => string
    isNow: string
    ahead: string
    jst: string
  }
  stories: { name: Record<StoryId, string>; note: Record<StoryId, (value: number, other?: number) => string> }
  readout: {
    label: string
    close: string
    more: string
    less: string
    systemPrice: string
    yenPerKwh: string
    spread: (low: string, high: string) => string
    everyAreaSystem: string
    pickArea: string
    okinawa: string
    hz: (hz: number) => string
    system: string
    lines: string
    split: string
    in: string
    out: string
    of: string
    demand: string
    mw: string
    whatRan: string
    noRecord: string
    solarCurtailed: string
    windCurtailed: string
    aPlant: string
    plantNote: string
    sources: Record<Source, string>
  }
  chart: {
    label: string
    series: Record<Series, string>
    storage: string
    sentOut: string
    curtailed: string
    demand: string
    gw: string
  }
  key: {
    key: string
    plants: string
    flow: string
    atLimit: string
    split: string
    all: string
    none: string
    zoomIn: string
    fuel: Record<Series, string>
    count: (n: number) => string
    mix: (area: string) => string
  }
}

const en: Strings = {
  subtitle: 'The Japanese power market on a map',
  theme: { toLight: 'Switch to the light theme', toDark: 'Switch to the dark theme' },
  language: { label: 'Language', other: '日本語' },
  time: {
    day: 'Delivery day',
    halfHour: 'Half hour',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    now: 'Now',
    jumpTo: 'Jump to',
    play: 'Play',
    pause: 'Pause',
    yesterday: 'Yesterday',
    today: 'Today',
    tomorrow: 'Tomorrow',
    daysAgo: (n) => `${n} days ago`,
    daysAhead: (n) => `In ${n} days`,
    isNow: 'now',
    ahead: 'ahead',
    jst: 'JST',
  },
  stories: {
    name: {
      summer: 'Summer peak',
      winter: 'Winter peak',
      split: 'Widest split',
      floor: 'Most at the floor',
      cheapest: 'Cheapest day',
    },
    note: {
      summer: (v) => `system price ${v.toFixed(2)} ¥/kWh`,
      winter: (v) => `system price ${v.toFixed(2)} ¥/kWh`,
      split: (v, w = 0) => `${v.toFixed(2)} to ${w.toFixed(2)} ¥/kWh`,
      floor: (v) => `${v} area half hours at 0.01 ¥/kWh`,
      cheapest: (v) => `mean ${v.toFixed(2)} ¥/kWh`,
    },
  },
  readout: {
    label: 'Readout',
    close: 'Close',
    more: 'More',
    less: 'Less',
    systemPrice: 'System price',
    yenPerKwh: '¥/kWh',
    spread: (low, high) => `Areas from ${low} to ${high}.`,
    everyAreaSystem: 'Every area at the system price.',
    pickArea: 'Pick an area for its price.',
    okinawa: 'Okinawa is not on the exchange.',
    hz: (hz) => `${hz} Hz`,
    system: 'System',
    lines: 'Lines',
    split: 'split',
    in: 'in',
    out: 'out',
    of: 'of',
    demand: 'Demand',
    mw: 'MW',
    whatRan: 'What ran',
    noRecord: 'No record for this half hour yet.',
    solarCurtailed: 'Solar curtailed',
    windCurtailed: 'Wind curtailed',
    aPlant: 'A plant',
    plantNote: 'Capacity as mapped in OpenStreetMap; what it runs is not public.',
    sources: {
      nuclear: 'Nuclear',
      lng: 'Gas',
      coal: 'Coal',
      oil: 'Oil',
      otherThermal: 'Other thermal',
      hydro: 'Hydro',
      geothermal: 'Geothermal',
      biomass: 'Biomass',
      solar: 'Solar',
      wind: 'Wind',
      pumped: 'Pumped storage',
      battery: 'Batteries',
      interconnector: 'Interconnectors',
      other: 'Other',
    },
  },
  chart: {
    label: 'Supply over the day',
    series: {
      coal: 'Coal',
      nuclear: 'Nuclear',
      renewables: 'Geothermal and biomass',
      otherThermal: 'Oil and other',
      solar: 'Solar',
      wind: 'Wind',
      gas: 'Gas',
      hydro: 'Hydro',
    },
    storage: 'Storage and imports',
    sentOut: 'Sent out, below the line',
    curtailed: 'Curtailed',
    demand: 'Demand',
    gw: 'GW',
  },
  key: {
    key: 'Key',
    plants: 'Plants',
    flow: 'flow',
    atLimit: 'at the limit',
    split: 'split',
    all: 'All',
    none: 'None',
    zoomIn: 'zoom in to see them',
    fuel: {
      coal: 'Coal',
      nuclear: 'Nuclear',
      renewables: 'Geo, bio',
      otherThermal: 'Oil, other',
      solar: 'Solar',
      wind: 'Wind',
      gas: 'Gas',
      hydro: 'Hydro',
    },
    count: (n) => `${n} ${n === 1 ? 'plant' : 'plants'}`,
    mix: (area) => `${area} mix`,
  },
}

const ja: Strings = {
  subtitle: '地図で見る日本の電力市場',
  theme: { toLight: 'ライトテーマにする', toDark: 'ダークテーマにする' },
  language: { label: '言語', other: 'English' },
  time: {
    day: '受渡日',
    halfHour: 'コマ',
    previousDay: '前の日',
    nextDay: '次の日',
    now: '今',
    jumpTo: 'ジャンプ',
    play: '再生',
    pause: '一時停止',
    yesterday: '昨日',
    today: '今日',
    tomorrow: '明日',
    daysAgo: (n) => `${n}日前`,
    daysAhead: (n) => `${n}日後`,
    isNow: '現在',
    ahead: 'これから',
    jst: 'JST',
  },
  stories: {
    name: {
      summer: '夏のピーク',
      winter: '冬のピーク',
      split: '最大の分断',
      floor: '最も下限価格',
      cheapest: '最も安い日',
    },
    note: {
      summer: (v) => `システムプライス ${v.toFixed(2)} 円/kWh`,
      winter: (v) => `システムプライス ${v.toFixed(2)} 円/kWh`,
      split: (v, w = 0) => `${v.toFixed(2)}〜${w.toFixed(2)} 円/kWh`,
      floor: (v) => `${v} エリアコマが 0.01 円/kWh`,
      cheapest: (v) => `平均 ${v.toFixed(2)} 円/kWh`,
    },
  },
  readout: {
    label: '詳細',
    close: '閉じる',
    more: 'もっと見る',
    less: '閉じる',
    systemPrice: 'システムプライス',
    yenPerKwh: '円/kWh',
    spread: (low, high) => `エリアプライスは ${low}〜${high}。`,
    everyAreaSystem: '全エリアがシステムプライス。',
    pickArea: 'エリアを選ぶと価格が出ます。',
    okinawa: '沖縄は取引所の対象外です。',
    hz: (hz) => `${hz} Hz`,
    system: 'システム',
    lines: '連系線',
    split: '分断',
    in: '受電',
    out: '送電',
    of: '/',
    demand: '需要',
    mw: 'MW',
    whatRan: '需給実績',
    noRecord: 'このコマの実績はまだありません。',
    solarCurtailed: '太陽光出力制御',
    windCurtailed: '風力出力制御',
    aPlant: '発電所',
    plantNote: '出力は OpenStreetMap の記載による設備容量。実際の発電量は公開されていません。',
    sources: {
      nuclear: '原子力',
      lng: '火力（LNG）',
      coal: '火力（石炭）',
      oil: '火力（石油）',
      otherThermal: '火力（その他）',
      hydro: '水力',
      geothermal: '地熱',
      biomass: 'バイオマス',
      solar: '太陽光',
      wind: '風力',
      pumped: '揚水',
      battery: '蓄電池',
      interconnector: '連系線',
      other: 'その他',
    },
  },
  chart: {
    label: '一日の供給',
    series: {
      coal: '石炭',
      nuclear: '原子力',
      renewables: '地熱・バイオマス',
      otherThermal: '石油・その他',
      solar: '太陽光',
      wind: '風力',
      gas: 'LNG',
      hydro: '水力',
    },
    storage: '蓄電・受電',
    sentOut: '送電・揚水（線の下）',
    curtailed: '出力制御',
    demand: '需要',
    gw: 'GW',
  },
  key: {
    key: '凡例',
    plants: '発電所',
    flow: '潮流',
    atLimit: '上限',
    split: '分断',
    all: '全て',
    none: 'なし',
    zoomIn: '拡大すると表示',
    fuel: {
      coal: '石炭',
      nuclear: '原子力',
      renewables: '地熱・バイオ',
      otherThermal: '石油・他',
      solar: '太陽光',
      wind: '風力',
      gas: 'LNG',
      hydro: '水力',
    },
    count: (n) => `${n}か所`,
    mix: (area) => `${area}の需給`,
  },
}

export const STRINGS: Record<Lang, Strings> = { en, ja }

const KEY = 'fiftysixty.lang'

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** The stored choice, else the browser's language, else English. */
export function loadLang(store = storage(), browserLanguage = navigator.language): Lang {
  try {
    const raw = store?.getItem(KEY)
    if (raw === 'en' || raw === 'ja') return raw
  } catch {
    // Unreadable storage: fall through to the browser's language.
  }
  return browserLanguage.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function saveLang(lang: Lang, store = storage()): void {
  try {
    store?.setItem(KEY, lang)
  } catch {
    // Storage full or forbidden: the choice lives on for this visit only.
  }
}
