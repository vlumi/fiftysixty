#!/usr/bin/env node
// Dissolves the prefecture polygons into the supply areas and derives the 50/60 split line, writing
// both to public/geo/ for the browser to fetch. Run when the area table or the source changes:
//
//   npm run regions
//
// Source: dataofjapan/land, from GSI's 地球地図日本 (Global Map Japan), which requires attribution.
import mapshaper from 'mapshaper'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AREAS } from '../src/regions/areas.ts'

const SOURCE = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'geo')

const byPrefecture = Object.fromEntries(AREAS.flatMap((a) => a.prefectures.map((p) => [p, a.id])))
const hzByArea = Object.fromEntries(AREAS.map((a) => [a.id, a.hz]))

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`${SOURCE}: ${response.status}`)
const source = Buffer.from(await response.arrayBuffer())

const commands = [
  '-i japan.geojson',
  `-each 'area = (${JSON.stringify(byPrefecture)})[id]; hz = (${JSON.stringify(hzByArea)})[area]'`,
  '-dissolve area copy-fields=hz',
  '-filter-islands min-area=20km2',
  '-simplify 5% keep-shapes',
  '-clean',
  '-o areas.geojson precision=0.0001',
  '-dissolve hz',
  '-innerlines',
  '-each \'name = "50/60"\'',
  '-o split.geojson precision=0.0001',
].join(' ')

const output = await mapshaper.applyCommands(commands, { 'japan.geojson': source })
await mkdir(OUT, { recursive: true })
for (const [name, content] of Object.entries(output)) {
  await writeFile(join(OUT, name), content)
  console.log(`${name}: ${(content.length / 1024).toFixed(0)} kB`)
}
