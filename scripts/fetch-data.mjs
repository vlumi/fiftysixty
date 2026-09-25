// Fetch the market data the site draws, into public/data (dev) or the web root's data/ (deploy).
//
//   node scripts/fetch-data.mjs                    # → public/data/
//   node scripts/fetch-data.mjs /var/www/fiftysixty/data
//
// JEPX publishes the day-ahead spot market as one CSV per fiscal year (April to March); each of the
// transmission companies publishes its area's half-hourly supply-demand record as one CSV per month under
// OCCTO's file name, eria_jukyu_<month>_<area number>.csv, on a host of its own. JEPX is UTF-8; the
// records are Shift_JIS, or UTF-8 some months at TEPCO, so each file is decoded as UTF-8 when it is valid
// UTF-8 and as Shift_JIS otherwise, and written as UTF-8 either way. JEPX serves its file only with the
// market page as the referer, and Kyushu's CDN refuses Node's TLS client while accepting curl's, so every
// file is downloaded with curl. Tohoku posts the running month as one file per day and the whole month
// only around the 25th of the next, so its month is stitched from the days when the month's own file is
// not there; a month no company has published at all is skipped rather than an error.
// OCCTO's reserve-margin site publishes each line's operating capacity, forecast flow and market split
// per half hour, a month per request, two days ahead, updated around 17:30; it is asked for once a day.
// The auction result lands by late morning and the companies add each half hour to the running month
// within about an hour, so the fetch runs hourly; a file already held is asked for with If-Modified-Since
// and left alone when the host says it has not changed, which the previous month's files never have.
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const output = process.argv[2] ?? 'public/data'
const now = new Date()
const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
const yyyymm = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
const month = yyyymm(now)
const previousMonth = yyyymm(new Date(now.getFullYear(), now.getMonth() - 1, 1))
const nextMonth = yyyymm(new Date(now.getFullYear(), now.getMonth() + 1, 1))

/** Where each transmission company keeps the month's record, by the area's name in the data directory. */
const RECORDS = {
  hokkaido: {
    month: (m) =>
      `https://www.hepco.co.jp/network/con_service/public_document/supply_demand_results/csv/eria_jukyu_${m}_01.csv`,
  },
  tohoku: {
    month: (m) => `https://setsuden.nw.tohoku-epco.co.jp/common/demand/eria_jukyu_${m}_02.csv`,
    day: (d) => `https://setsuden.nw.tohoku-epco.co.jp/common/demand/realtime_jukyu/realtime_jukyu_${d}_02.csv`,
  },
  tepco: { month: (m) => `https://www.tepco.co.jp/forecast/html/images/eria_jukyu_${m}_03.csv` },
  chubu: { month: (m) => `https://powergrid.chuden.co.jp/denki_yoho_content_data/eria_jukyu_${m}_04.csv` },
  hokuriku: { month: (m) => `https://www.rikuden.co.jp/nw/denki-yoho/csv/eria_jukyu_${m}_05.csv` },
  kansai: {
    month: (m) => `https://www.kansai-td.co.jp/interchange/denkiyoho/area-performance/eria_jukyu_${m}_06.csv`,
  },
  chugoku: { month: (m) => `https://www.energia.co.jp/nw/jukyuu/sys/eria_jukyu_${m}_07.csv` },
  shikoku: { month: (m) => `https://www.yonden.co.jp/nw/supply_demand/csv/eria_jukyu_${m}_08.csv` },
  kyushu: { month: (m) => `https://www.kyuden.co.jp/td_area_jukyu/csv/eria_jukyu_${m}_09.csv` },
}

/** The days of a month that have begun, as YYYYMMDD. */
function daysOf(m) {
  const year = Number(m.slice(0, 4))
  const monthIndex = Number(m.slice(4)) - 1
  const last = m === month ? now.getDate() : new Date(year, monthIndex + 1, 0).getDate()
  return Array.from({ length: last }, (_, i) => `${m}${String(i + 1).padStart(2, '0')}`)
}

/** OCCTO's interconnector forecast for a month, from its first day to its last. */
function occtoRange(m) {
  const year = Number(m.slice(0, 4))
  const monthIndex = Number(m.slice(4)) - 1
  const last = new Date(year, monthIndex + 1, 0).getDate()
  const day = (d) => `${year}/${String(monthIndex + 1).padStart(2, '0')}/${String(d).padStart(2, '0')}`
  return `https://web-kohyo.occto.or.jp/kks-web-public/download/downloadCsv?jhSybt=06&tgtYmdFrom=${day(1)}&tgtYmdTo=${day(last)}`
}

const SOURCES = [
  ...[previousMonth, month, nextMonth].map((m) => ({
    name: `occto-renkei-${m}.csv`,
    url: occtoRange(m),
    headers: {},
    // Refreshed once a day: the site answers every request in full, and the forecast moves once a day.
    staleAfterMs: 20 * 3600_000,
    // Next month exists only for its first days, from two days before; until then the site answers with a page.
    optional: m === nextMonth,
  })),
  // Last fiscal year's prices, final since March, are taken once: they hold the winter for the story days.
  ...[fiscalYear - 1, fiscalYear].map((year) => ({
    name: `jepx-spot-${year}.csv`,
    url: `https://www.jepx.jp/js/csv_read.php?dir=spot_summary&file=spot_summary_${year}.csv`,
    headers: { Referer: 'https://www.jepx.jp/electricpower/market-data/spot/' },
    once: year < fiscalYear,
  })),
  // The current month grows through the day; the previous one stays, so the map has a month of record behind it.
  ...[previousMonth, month].flatMap((m) =>
    Object.entries(RECORDS).map(([area, { month: path, day }]) => ({
      name: `${area}-jukyu-${m}.csv`,
      url: path(m),
      headers: {},
      days: day && daysOf(m).map(day),
    })),
  ),
]

function decode(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('shift_jis').decode(bytes)
  }
}

const USER_AGENT = 'fiftysixty/0.0 (+https://github.com/vlumi/fiftysixty)'

const UNCHANGED = Symbol('unchanged')

/** The file's bytes; null when the server has no such file yet; UNCHANGED when it is no newer than `since`. */
async function download(source, target, since) {
  const headers = Object.entries(source.headers).flatMap(([k, v]) => ['-H', `${k}: ${v}`])
  const conditional = since && existsSync(since) ? ['-z', since] : []
  const args = [
    '-sSL',
    '--compressed',
    '-A',
    USER_AGENT,
    ...headers,
    ...conditional,
    '-o',
    target,
    '-w',
    '%{http_code}',
  ]
  const { stdout: status } = await promisify(execFile)('curl', [...args, source.url])
  if (status === '404') return null
  if (status === '304') return UNCHANGED
  if (status !== '200') throw new Error(`${source.url} responded ${status}`)
  return readFile(target)
}

/** The month stitched from its daily files, the header kept once; null when not even the first day is there. */
async function downloadDays(source, target) {
  const lines = []
  for (const url of source.days) {
    const bytes = await download({ ...source, url }, target)
    if (!bytes) break
    const day = decode(bytes).trim().split(/\r?\n/)
    lines.push(...(lines.length ? day.slice(2) : day))
  }
  return lines.length ? lines.join('\n') + '\n' : null
}

await mkdir(output, { recursive: true })
for (const source of SOURCES) {
  const target = join(output, source.name)
  const raw = `${target}.raw`
  if (source.once && existsSync(target)) continue
  if (source.staleAfterMs && existsSync(target) && Date.now() - (await stat(target)).mtimeMs < source.staleAfterMs) {
    console.log(`fresh enough: ${source.name}`)
    continue
  }
  try {
    // A month stitched from days is asked for afresh: a host may say 'not modified' about a file it does not have.
    const bytes = await download(source, raw, source.days ? undefined : target)
    if (bytes === UNCHANGED) {
      console.log(`unchanged: ${source.name}`)
      continue
    }
    const text = bytes ? decode(bytes) : source.days ? await downloadDays(source, raw) : null
    const page = !text || !text.includes(',') || text.trimStart().startsWith('<')
    // OCCTO answers a month it has nothing for with the header alone, or with a page.
    if (!text || (page && source.optional) || text.trim().split('\n').length < 3) {
      console.log(`not published yet: ${source.name}`)
      continue
    }
    if (page) throw new Error(`Unexpected payload from ${source.url}`)
    await writeFile(`${target}.tmp`, text)
    await rename(`${target}.tmp`, target)
    console.log(`${text.split('\n').length - 1} rows → ${target}`)
  } finally {
    await rm(raw, { force: true })
  }
}
