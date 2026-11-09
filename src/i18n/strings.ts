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
  /** The name in the header as a link back to the opening view. */
  home: string
  map: string
  theme: string
  close: string
  /** A part of the page threw while rendering. */
  failed: string
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
    co2: string
    co2By: string
    data: string
    fetchedAt: (at: string) => string
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
    history: string
    supply: string
    gwh: string
    share: string
    demand: string
    peak: string
    low: string
    renewables: string
    curtailed: string
    exported: string
    storedIn: string
    prices: string
    meanPrice: string
    meanOf: (price: string) => string
    weightedOf: (price: string) => string
    spreadOf: (low: string, high: string) => string
    lowPrice: string
    highPrice: string
    price: string
    floor: string
    floorArea: string
    turnover: string
    soFar: (time: string) => string
    japan: string
    notAll: string
    without: (areas: string) => string
    month: (year: number, month: number) => string
    co2: string
    co2Intensity: string
    kt: string
    estimated: string
  }
  readout: {
    label: string
    back: string
    systemPrice: string
    yenPerKwh: string
    /** The unit large amounts of yen are counted in, and the decimals it reads well to. */
    largeYen: { per: number; digits: number; unit: string }
    spread: (low: string, high: string) => string
    everyAreaSystem: string
    pickArea: string
    okinawa: string
    hz: (hz: number) => string
    half: string
    halfHistory: string
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
    notAllSlot: string
    /** A data file could not be loaded; the app asks again. */
    loadFailed: string
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
    price: string
    history: string
    splits: string
    splitsKey: string
    duration: string
    durationKey: (halfHours: string, from: string, to: string) => string
    mean: string
    median: string
    topTenth: string
    atFloor: string
    yen: (price: number) => string
    auction: string
    offered: string
    asked: string
    cleared: string
    turnover: string
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
  home: 'Back to the opening view',
  map: 'Map',
  theme: 'Light theme',
  close: 'Close',
  failed: 'Something went wrong; reload the page.',
  credits: {
    label: 'About and credits',
    title: 'About',
    about:
      'The Japanese day-ahead power market on a map: the spot price of each area for each half hour, what ran in each area, what crossed the lines between them as the companies recorded it or OCCTO planned it, and the plants. Pick a day and a half hour under the map, an area, a half of the grid or a plant for its numbers, and a story from the list for a day worth seeing; the switch in the readout turns it to the whole day or the price history.',
    credits: 'Credits',
    map: 'Map',
    regions: 'Areas',
    plants: 'Plants',
    prices: 'Prices',
    records: 'Supply and demand',
    recordsBy: "The nine transmission companies, in OCCTO's format",
    lines: 'Interconnectors',
    co2: 'CO₂',
    co2By:
      'Estimated from the fuel burnt, after CRIEPI (2016): coal 864, LNG 430, oil and other thermal 695 g/kWh; biomass as none.',
    data: 'Data',
    fetchedAt: (at) => `Fetched hourly on the host, last at ${at} JST`,
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
    history: 'History',
    supply: 'How the day was supplied',
    gwh: 'GWh',
    share: 'share',
    demand: 'Demand',
    peak: 'Peak',
    low: 'Low',
    renewables: 'Renewable share',
    curtailed: 'Curtailed',
    exported: 'Exported',
    storedIn: 'Into storage',
    prices: 'Prices',
    meanPrice: 'Mean price',
    meanOf: (price) => `mean ${price} ¥/kWh`,
    weightedOf: (price) => `weighted ${price} ¥/kWh`,
    spreadOf: (low, high) => `from ${low} to ${high} ¥/kWh`,
    lowPrice: 'Lowest price',
    highPrice: 'Highest price',
    price: 'Price, weighted by demand',
    floor: 'Half hours at the floor',
    floorArea: 'Area half hours at the floor',
    turnover: 'Turnover, at the system price',
    soFar: (time) => `Through ${time} so far.`,
    japan: 'All Japan',
    notAll: 'No area has recorded the day yet.',
    without: (areas) => `without ${areas}, not recorded yet`,
    month: (year, month) => `${new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })} ${year}`,
    co2: 'CO₂, estimated',
    co2Intensity: 'CO₂ per kWh generated',
    kt: 'kt',
    estimated: 'estimated',
  },
  readout: {
    label: 'Readout',
    back: 'Back',
    systemPrice: 'System price',
    yenPerKwh: '¥/kWh',
    largeYen: { per: 1e9, digits: 2, unit: '¥ bn' },
    spread: (low, high) => `Areas from ${low} to ${high}.`,
    everyAreaSystem: 'Every area at the system price.',
    pickArea: 'Pick an area for its price.',
    okinawa: 'Okinawa is not on the exchange.',
    hz: (hz) => `${hz} Hz`,
    half: 'Half of the grid',
    halfHistory: 'A half has no price of its own; this is the system price.',
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
    notAllSlot: 'Not every area has recorded this half hour yet.',
    loadFailed: 'Some of the data could not be loaded; trying again.',
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
    price: 'Price over the day',
    history: 'Price history',
    splits: 'Market splits',
    splitsKey: 'Half hours the line split, share of the day',
    duration: 'Price duration',
    durationKey: (halfHours, from, to) => `${halfHours} half hours, ${from} to ${to}, the dearest first`,
    mean: 'Mean',
    median: 'Median',
    topTenth: 'A tenth of the time above',
    atFloor: 'At the floor',
    auction: 'Auction over the day',
    offered: 'Offered',
    asked: 'Asked',
    cleared: 'Cleared',
    turnover: 'Turnover',
    yen: (price) => `¥${price}`,
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
  home: '最初の表示に戻る',
  map: '地図',
  theme: 'ライトテーマ',
  close: '閉じる',
  failed: 'エラーが起きました。ページを再読み込みしてください。',
  credits: {
    label: '情報とクレジット',
    title: 'このサイトについて',
    about:
      '日本の前日スポット電力市場を地図に。エリアごと・コマごとのスポット価格、各エリアで何が動いたか、連系線を流れた電力（各社の実績、なければOCCTOの計画）、そして発電所。地図の下で日とコマを選び、エリア、50Hzか60Hzの系統、発電所を選ぶとその数字が、一覧から選ぶと見どころの日が出ます。パネルの切替で一日全体や価格の履歴も見られます。',
    credits: 'クレジット',
    map: '地図',
    regions: 'エリア',
    plants: '発電所',
    prices: '価格',
    records: '需給実績',
    recordsBy: '一般送配電事業者9社、OCCTO の様式で',
    lines: '連系線',
    co2: 'CO₂',
    co2By: '燃料の燃焼分を電中研（2016）の係数で推計：石炭 864、LNG 430、石油・その他火力 695 g/kWh、バイオマスは 0。',
    data: 'データ',
    fetchedAt: (at) => `毎時取得、最終 ${at} JST`,
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
    history: '推移',
    supply: '1日の供給',
    gwh: 'GWh',
    share: '比率',
    demand: '需要',
    peak: '最大',
    low: '最小',
    renewables: '再エネ比率',
    curtailed: '出力制御',
    exported: '送電',
    storedIn: '揚水・蓄電池（充電）',
    prices: '価格',
    meanPrice: '平均価格',
    meanOf: (price) => `平均 ${price} 円/kWh`,
    weightedOf: (price) => `需要加重 ${price} 円/kWh`,
    spreadOf: (low, high) => `${low}〜${high} 円/kWh`,
    lowPrice: '最低価格',
    highPrice: '最高価格',
    price: '需要加重平均価格',
    floor: '下限価格のコマ',
    floorArea: '下限価格のエリア・コマ',
    turnover: '約定金額（システムプライス換算）',
    soFar: (time) => `${time}まで。`,
    japan: '全国',
    notAll: 'まだどのエリアもこの日の実績がありません。',
    without: (areas) => `${areas}は実績未着のため除く`,
    month: (year, month) => `${year}年${month}月`,
    co2: 'CO₂（推計）',
    co2Intensity: '発電1kWhあたりCO₂',
    kt: '千t',
    estimated: '推計',
  },
  readout: {
    label: '詳細',
    back: '戻る',
    systemPrice: 'システムプライス',
    yenPerKwh: '円/kWh',
    largeYen: { per: 1e8, digits: 1, unit: '億円' },
    spread: (low, high) => `エリアプライスは ${low}〜${high}。`,
    everyAreaSystem: '全エリアがシステムプライス。',
    pickArea: 'エリアを選ぶと価格が出ます。',
    okinawa: '沖縄は取引所の対象外です。',
    hz: (hz) => `${hz} Hz`,
    half: '周波数帯',
    halfHistory: '周波数帯に固有の価格はありません。システムプライスを示します。',
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
    notAllSlot: 'まだ全エリアのこのコマの実績がそろっていません。',
    loadFailed: '一部のデータを読み込めませんでした。再試行します。',
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
    price: '一日の価格',
    history: '価格の推移',
    splits: '市場分断の推移',
    splitsKey: '分断したコマの割合',
    duration: '価格持続曲線',
    durationKey: (halfHours, from, to) => `${from}〜${to}の${halfHours}コマ、高い順`,
    mean: '平均',
    median: '中央値',
    topTenth: '上位1割の下限',
    atFloor: '下限価格のコマ',
    auction: '一日の入札',
    offered: '売り入札',
    asked: '買い入札',
    cleared: '約定',
    turnover: '約定金額',
    yen: (price) => `${price}円`,
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
