// Fetch the market data the site draws, into public/data (dev) or the web root's data/ (deploy).
//
//   node scripts/fetch-data.mjs                    # → public/data/
//   node scripts/fetch-data.mjs /var/www/fiftysixty/data
//
// JEPX publishes the day-ahead spot market as one CSV per fiscal year (April to March); each of the
// transmission companies publishes its area's half-hourly supply-demand record, TEPCO as one CSV per
// month. JEPX is UTF-8; TEPCO's files are UTF-8 some months and Shift_JIS others, so each file is
// decoded as UTF-8 when it is valid UTF-8 and as Shift_JIS otherwise, and written as UTF-8 either way.
// JEPX serves its file only with the market page as the referer. Both sources move once a day, the
// auction result by late morning and the previous day's balance by evening, so a daily fetch after both
// is current; an intraday view would want its own, more frequent fetch of the hour-ahead and flow data.
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const output = process.argv[2] ?? 'public/data'
const now = new Date()
const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
const month = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

const SOURCES = [
  {
    name: `jepx-spot-${fiscalYear}.csv`,
    url: `https://www.jepx.jp/js/csv_read.php?dir=spot_summary&file=spot_summary_${fiscalYear}.csv`,
    headers: { Referer: 'https://www.jepx.jp/electricpower/market-data/spot/' },
  },
  {
    name: `tepco-jukyu-${month}.csv`,
    url: `https://www.tepco.co.jp/forecast/html/images/eria_jukyu_${month}_03.csv`,
    headers: {},
  },
]

function decode(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('shift_jis').decode(bytes)
  }
}

await mkdir(output, { recursive: true })
for (const source of SOURCES) {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'fiftysixty/0.0 (+https://github.com/vlumi/fiftysixty)', ...source.headers },
  })
  if (!response.ok) throw new Error(`${source.url} responded ${response.status}`)
  const text = decode(await response.arrayBuffer())
  if (!text.includes(',') || text.trimStart().startsWith('<')) throw new Error(`Unexpected payload from ${source.url}`)
  const target = join(output, source.name)
  await writeFile(`${target}.tmp`, text)
  await rename(`${target}.tmp`, target)
  console.log(`${text.split('\n').length - 1} rows → ${target}`)
}
