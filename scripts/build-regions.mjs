#!/usr/bin/env node
// Dissolves the prefecture polygons into the supply areas and derives the 50/60 split line, writing
// both to public/geo/ for the browser to fetch. Run when the area table or the source changes:
//
//   npm run regions
//
// mapshaper does the geometry; it is not a dependency of the project, since its native addons are
// of no use on the host, but is fetched by npx for this script alone, which drives its command line.
// Source: dataofjapan/land, from GSI's 地球地図日本 (Global Map Japan), which requires attribution.
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { AREAS } from '../src/regions/areas.ts'

const SOURCE = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'geo')

const byPrefecture = Object.fromEntries(AREAS.flatMap((a) => a.prefectures.map((p) => [p, a.id])))
const hzByArea = Object.fromEntries(AREAS.map((a) => [a.id, a.hz]))

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`${SOURCE}: ${response.status}`)
const work = await mkdtemp(join(tmpdir(), 'fiftysixty-regions-'))
try {
  await writeFile(join(work, 'japan.geojson'), Buffer.from(await response.arrayBuffer()))
  const commands = [
    ['-i', 'japan.geojson'],
    ['-each', `area = (${JSON.stringify(byPrefecture)})[id]; hz = (${JSON.stringify(hzByArea)})[area]`],
    ['-dissolve', 'area', 'copy-fields=hz'],
    ['-filter-islands', 'min-area=20km2'],
    ['-simplify', '5%', 'keep-shapes'],
    ['-clean'],
    ['-o', 'areas.geojson', 'precision=0.0001'],
    ['-dissolve', 'hz'],
    ['-innerlines'],
    ['-each', 'name = "50/60"'],
    ['-o', 'split.geojson', 'precision=0.0001'],
  ].flat()
  await promisify(execFile)('mapshaper', commands, { cwd: work })
  await mkdir(OUT, { recursive: true })
  for (const name of ['areas.geojson', 'split.geojson']) {
    const content = await readFile(join(work, name))
    await writeFile(join(OUT, name), content)
    console.log(`${name}: ${(content.length / 1024).toFixed(0)} kB`)
  }
} finally {
  await rm(work, { recursive: true, force: true })
}
