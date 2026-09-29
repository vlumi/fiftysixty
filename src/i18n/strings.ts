import type { Series } from '../market/stack'
import type { StoryId } from '../market/stories'
import { readItem, storage, writeItem } from '../shared/storage'

export type Lang = 'en' | 'ja'
export const LANGS: readonly Lang[] = ['en', 'ja']
/** Each language by its own name, whatever the language chosen: the picker lists them so. */
export const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', ja: '日本語' }

/** Every visible word, by key, in each language; the layout never changes with the language, only the words. */
export interface Strings {
  subtitle: string
  map: string
  theme: string
  close: string
  credits: {
    label: string
    title: string
    about: string
    credits: string
    map: string
    regions: string
    plants: string
    prices: string
    records: string
    recordsBy: string
    lines: string
    source: string
  }
  language: string
  /** The keyboard scheme's help, by what each key does; see shortcuts.ts. */
  help: {
    title: string
    slot: string
    day: string
    area: string
    playPause: string
    now: string
    theme: string
    escape: string
    about: string
  }
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
  day: {
    view: string
    halfHour: string
    day: string
    supply: string
    gwh: string
    share: string
    demand: string
    peak: string
    low: string
    renewables: string
    curtailed: string
    imported: string
    exported: string
    storedIn: string
    storedOut: string
    price: string
    floor: string
    soFar: (time: string) => string
    japan: string
    notAll: string
    month: string
  }
  readout: {
    label: string
    back: string
    systemPrice: string
    yenPerKwh: string
    spread: (low: string, high: string) => string
    everyAreaSystem: string
    pickArea: string
    okinawa: string
    hz: (hz: number) => string
    system: string
    lines: string
    recorded: string
    planned: string
    loopWith: (a: string, b: string) => string
    split: string
    in: string
    out: string
    of: string
    mw: string
    whatRan: string
    noRecord: string
    aPlant: string
    plantNote: string
  }
  chart: {
    label: string
    series: Record<Series, string>
    storageOut: string
    imports: string
    storageIn: string
    exports: string
    curtailed: string
    demand: string
    gw: string
  }
  key: {
    key: string
    layers: string
    flows: string
    mixes: string
    plants: string
    planned: string
    recorded: string
    atLimit: string
    fork: string
    split: string
    byFuel: string
    fuel: Record<Series, string>
    count: (n: number) => string
    mix: (area: string) => string
    noData: string
  }
}

const en: Strings = {
  subtitle: 'The Japanese power market on a map',
  map: 'Map',
  theme: 'Light theme',
  close: 'Close',
  credits: {
    label: 'About and credits',
    title: 'About',
    about:
      'The Japanese day-ahead power market on a map: the spot price of each area for each half hour, what ran in each area, the power forecast to flow between them, and the plants. Pick a day and a half hour under the map, an area or a plant for its numbers, and a story from the list for a day worth seeing.',
    credits: 'Credits',
    map: 'Map',
    regions: 'Areas',
    plants: 'Plants',
    prices: 'Prices',
    records: 'Supply and demand',
    recordsBy: "The nine transmission companies, in OCCTO's format",
    lines: 'Interconnectors',
    source: 'Source on GitHub',
  },
  language: 'Language',
  help: {
    title: 'Keyboard',
    slot: 'Half hour back or forward',
    day: 'Previous or next day',
    area: 'Walk the areas north to south',
    playPause: 'Play or pause',
    now: 'Now',
    theme: 'Light or dark',
    escape: 'Let the area or plant go',
    about: 'This',
  },
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
  day: {
    view: 'View',
    halfHour: 'Half hour',
    day: 'Day',
    supply: 'How the day was supplied',
    gwh: 'GWh',
    share: 'share',
    demand: 'Demand',
    peak: 'Peak',
    low: 'Low',
    renewables: 'Renewable share',
    curtailed: 'Curtailed',
    imported: 'Imported',
    exported: 'Exported',
    storedIn: 'Into storage',
    storedOut: 'From storage',
    price: 'Price, weighted by demand',
    floor: 'Half hours at the floor',
    soFar: (time) => `Through ${time} so far.`,
    japan: 'All Japan',
    notAll: 'Not every area has recorded the whole day yet.',
    month: 'The month, a day a bar',
  },
  readout: {
    label: 'Readout',
    back: 'Back',
    systemPrice: 'System price',
    yenPerKwh: '¥/kWh',
    spread: (low, high) => `Areas from ${low} to ${high}.`,
    everyAreaSystem: 'Every area at the system price.',
    pickArea: 'Pick an area for its price.',
    okinawa: 'Okinawa is not on the exchange.',
    hz: (hz) => `${hz} Hz`,
    system: 'System',
    lines: 'Lines',
    recorded: 'recorded',
    planned: 'OCCTO plan',
    loopWith: (a, b) => `${a} and ${b}`,
    split: 'split',
    in: 'in',
    out: 'out',
    of: 'of',
    mw: 'MW',
    whatRan: 'What ran',
    noRecord: 'No record for this half hour yet.',
    aPlant: 'A plant',
    plantNote: 'Capacity as mapped in OpenStreetMap; what it runs is not public.',
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
    storageOut: 'From storage',
    imports: 'Imports',
    storageIn: 'Into storage',
    exports: 'Exports',
    curtailed: 'Curtailed',
    demand: 'Demand',
    gw: 'GW',
  },
  key: {
    key: 'Key',
    layers: 'Layers',
    flows: 'Flows',
    mixes: 'Mix columns',
    plants: 'Plants',
    planned: 'OCCTO plan',
    recorded: 'recorded',
    atLimit: 'at the limit',
    fork: 'two lines, total only',
    split: 'market split',
    byFuel: 'By fuel',
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
    noData: 'no data',
  },
}

const ja: Strings = {
  subtitle: '地図で見る日本の電力市場',
  map: '地図',
  theme: 'ライトテーマ',
  close: '閉じる',
  credits: {
    label: '情報とクレジット',
    title: 'このサイトについて',
    about:
      '日本の前日スポット電力市場を地図に。エリアごと・コマごとのスポット価格、各エリアで何が動いたか、連系線を流れる見込みの電力、そして発電所。地図の下で日とコマを選び、エリアや発電所を選ぶとその数字が、一覧から選ぶと見どころの日が出ます。',
    credits: 'クレジット',
    map: '地図',
    regions: 'エリア',
    plants: '発電所',
    prices: '価格',
    records: '需給実績',
    recordsBy: '一般送配電事業者9社、OCCTO の様式で',
    lines: '連系線',
    source: 'GitHub のソース',
  },
  language: '言語',
  help: {
    title: 'キーボード',
    slot: 'コマを前後に',
    day: '前の日・次の日',
    area: 'エリアを北から南へ',
    playPause: '再生・停止',
    now: '現在へ',
    theme: 'ライト / ダーク',
    escape: 'エリアや発電所の選択を外す',
    about: 'この画面',
  },
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
  day: {
    view: '表示',
    halfHour: 'コマ',
    day: '1日',
    supply: '1日の供給',
    gwh: 'GWh',
    share: '比率',
    demand: '需要',
    peak: '最大',
    low: '最小',
    renewables: '再エネ比率',
    curtailed: '出力制御',
    imported: '受電',
    exported: '送電',
    storedIn: '揚水・蓄電池（充電）',
    storedOut: '揚水・蓄電池（放電）',
    price: '需要加重平均価格',
    floor: '最低価格のコマ',
    soFar: (time) => `${time}まで。`,
    japan: '全国',
    notAll: 'まだ全エリアの1日分の実績がそろっていません。',
    month: '今月の各日',
  },
  readout: {
    label: '詳細',
    back: '戻る',
    systemPrice: 'システムプライス',
    yenPerKwh: '円/kWh',
    spread: (low, high) => `エリアプライスは ${low}〜${high}。`,
    everyAreaSystem: '全エリアがシステムプライス。',
    pickArea: 'エリアを選ぶと価格が出ます。',
    okinawa: '沖縄は取引所の対象外です。',
    hz: (hz) => `${hz} Hz`,
    system: 'システム',
    lines: '連系線',
    recorded: '実績',
    planned: 'OCCTO計画',
    loopWith: (a, b) => `${a}・${b}`,
    split: '分断',
    in: '受電',
    out: '送電',
    of: '/',
    mw: 'MW',
    whatRan: '需給実績',
    noRecord: 'このコマの実績はまだありません。',
    aPlant: '発電所',
    plantNote: '出力は OpenStreetMap の記載による設備容量。実際の発電量は公開されていません。',
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
    storageOut: '揚水・蓄電池（放電）',
    imports: '受電',
    storageIn: '揚水・蓄電池（充電）',
    exports: '送電',
    curtailed: '出力制御',
    demand: '需要',
    gw: 'GW',
  },
  key: {
    key: '凡例',
    layers: 'レイヤー',
    flows: '連系線潮流',
    mixes: '需給の柱',
    plants: '発電所',
    planned: 'OCCTO計画',
    recorded: '実績',
    atLimit: '上限',
    fork: '2本の合計のみ',
    split: '市場分断',
    byFuel: '燃料別',
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
    noData: 'データなし',
  },
}

export const STRINGS: Record<Lang, Strings> = { en, ja }

const KEY = 'fiftysixty.lang'

/** The stored choice, else the browser's language, else English. */
export function loadLang(store = storage(), browserLanguage = navigator.language): Lang {
  const raw = readItem(KEY, store)
  if (raw === 'en' || raw === 'ja') return raw
  return browserLanguage.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function saveLang(lang: Lang, store = storage()): void {
  writeItem(KEY, lang, store)
}
