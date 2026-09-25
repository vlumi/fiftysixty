// Fetch the market data the site draws, into public/data (dev) or the web root's data/ (deploy).
//
//   node scripts/fetch-data.mjs                    # → public/data/
//   node scripts/fetch-data.mjs /var/www/fiftysixty/data
//
// JEPX publishes the day-ahead spot market as one CSV per fiscal year (April to March); each of the
// transmission companies publishes its area's half-hourly supply-demand record, TEPCO and Kyushu as one
// CSV per month. JEPX is UTF-8; TEPCO's files are UTF-8 some months and Shift_JIS others and Kyushu's
// are Shift_JIS, so each file is decoded as UTF-8 when it is valid UTF-8 and as Shift_JIS otherwise, and
// written as UTF-8 either way. JEPX serves its file only with the market page as the referer, and
// Kyushu's CDN refuses Node's TLS client while accepting curl's, so every file is downloaded with curl.
// All sources move once a day, the auction result by late morning and the previous day's balance by
// evening, so a daily fetch after both is current; an intraday view would want its own, more frequent
// fetch of the hour-ahead and flow data.
import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const output = process.argv[2] ?? 'public/data'
const now = new Date()
const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
const yyyymm = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
const month = yyyymm(now)
const previousMonth = yyyymm(new Date(now.getFullYear(), now.getMonth() - 1, 1))

const SOURCES = [
  {
    name: `jepx-spot-${fiscalYear}.csv`,
    url: `https://www.jepx.jp/js/csv_read.php?dir=spot_summary&file=spot_summary_${fiscalYear}.csv`,
    headers: { Referer: 'https://www.jepx.jp/electricpower/market-data/spot/' },
  },
  // The current month grows through the day; the previous one stays, so the map has a month of record behind it.
  ...[previousMonth, month].flatMap((m) => [
    {
      name: `tepco-jukyu-${m}.csv`,
      url: `https://www.tepco.co.jp/forecast/html/images/eria_jukyu_${m}_03.csv`,
      headers: {},
    },
    {
      name: `kyushu-jukyu-${m}.csv`,
      url: `https://www.kyuden.co.jp/td_area_jukyu/csv/eria_jukyu_${m}_09.csv`,
      headers: {},
    },
  ]),
]

function decode(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('shift_jis').decode(bytes)
  }
}

const USER_AGENT = 'fiftysixty/0.0 (+https://github.com/vlumi/fiftysixty)'

async function download(source, target) {
  const headers = Object.entries(source.headers).flatMap(([k, v]) => ['-H', `${k}: ${v}`])
  await promisify(execFile)('curl', ['-fsSL', '--compressed', '-A', USER_AGENT, ...headers, '-o', target, source.url])
  return readFile(target)
}

await mkdir(output, { recursive: true })
for (const source of SOURCES) {
  const target = join(output, source.name)
  const raw = `${target}.raw`
  try {
    const text = decode(await download(source, raw))
    if (!text.includes(',') || text.trimStart().startsWith('<'))
      throw new Error(`Unexpected payload from ${source.url}`)
    await writeFile(`${target}.tmp`, text)
    await rename(`${target}.tmp`, target)
    console.log(`${text.split('\n').length - 1} rows → ${target}`)
  } finally {
    await rm(raw, { force: true })
  }
}
