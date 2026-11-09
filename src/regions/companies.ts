import type { Lang } from '../i18n/strings'
import type { PricedArea } from './areas'

/** The transmission company that records an area, by its full name and the short one its record is headed with. */
export interface Company {
  name: string
  ja: string
  short: string
  shortJa: string
}

export const COMPANIES: Readonly<Record<PricedArea, Company>> = {
  hokkaido: {
    name: 'Hokkaido Electric Power Network',
    ja: '北海道電力ネットワーク',
    short: 'Hokkaido',
    shortJa: '北海道電力NW',
  },
  tohoku: { name: 'Tohoku Electric Power Network', ja: '東北電力ネットワーク', short: 'Tohoku', shortJa: '東北電力NW' },
  tokyo: { name: 'TEPCO Power Grid', ja: '東京電力パワーグリッド', short: 'TEPCO', shortJa: '東京電力PG' },
  chubu: { name: 'Chubu Electric Power Grid', ja: '中部電力パワーグリッド', short: 'Chubu', shortJa: '中部電力PG' },
  hokuriku: {
    name: 'Hokuriku Electric Power Transmission & Distribution',
    ja: '北陸電力送配電',
    short: 'Hokuriku',
    shortJa: '北陸電力送配電',
  },
  kansai: {
    name: 'Kansai Transmission and Distribution',
    ja: '関西電力送配電',
    short: 'Kansai',
    shortJa: '関西電力送配電',
  },
  chugoku: {
    name: 'Chugoku Electric Power Transmission & Distribution',
    ja: '中国電力ネットワーク',
    short: 'Chugoku',
    shortJa: '中国電力NW',
  },
  shikoku: {
    name: 'Shikoku Electric Power Transmission & Distribution',
    ja: '四国電力送配電',
    short: 'Shikoku',
    shortJa: '四国電力送配電',
  },
  kyushu: {
    name: 'Kyushu Electric Power Transmission and Distribution',
    ja: '九州電力送配電',
    short: 'Kyushu',
    shortJa: '九州電力送配電',
  },
}

export const companyName = (area: PricedArea, lang: Lang) => (lang === 'ja' ? COMPANIES[area].ja : COMPANIES[area].name)

export const companyShort = (area: PricedArea, lang: Lang) =>
  lang === 'ja' ? COMPANIES[area].shortJa : COMPANIES[area].short
