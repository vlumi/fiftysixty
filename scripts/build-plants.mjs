#!/usr/bin/env node
// Collects Japan's power plants from OpenStreetMap, the ones tagged with an electric output of 10 MW or more,
// into public/geo/plants.geojson for the browser to fetch. Run when the map should catch up with the mappers:
//
//   npm run plants                        # asks Overpass
//   npm run plants -- overpass.json       # reads a saved Overpass answer instead, kinder to the servers
//
// Each plant carries its name (English where mapped), its fuel folded onto the chart's series, and its
// capacity in MW as mapped; what a plant runs is not public and is not claimed. OpenStreetMap data is
// © OpenStreetMap contributors, ODbL.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OVERPASS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter']
const QUERY = `[out:json][timeout:240];area["ISO3166-1"="JP"]["admin_level"="2"]->.jp;nwr["power"="plant"]["plant:output:electricity"](area.jp);out tags center;`
const MIN_MW = 10
// The main servers answer 406 to a request without a User-Agent that says who is asking.
const USER_AGENT = 'fiftysixty/0.0 (+https://github.com/vlumi/fiftysixty)'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'geo', 'plants.geojson')

/** OpenStreetMap's plant:source values onto the chart's series; a list of sources counts by its first. */
const FUELS = {
  nuclear: 'nuclear',
  coal: 'coal',
  gas: 'gas',
  oil: 'otherThermal',
  diesel: 'otherThermal',
  waste: 'otherThermal',
  hydro: 'hydro',
  solar: 'solar',
  wind: 'wind',
  geothermal: 'renewables',
  biomass: 'renewables',
}

function megawatts(text) {
  const match = /^([\d.]+)\s*(GW|MW|kW|W)?$/i.exec(String(text).replace(/,/g, '').trim())
  if (!match) return null
  const value = Number(match[1])
  const unit = (match[2] ?? 'W').toUpperCase()
  return unit === 'GW' ? value * 1000 : unit === 'MW' ? value : unit === 'KW' ? value / 1000 : value / 1e6
}

async function ask() {
  const saved = process.argv[2]
  if (saved) return JSON.parse(await readFile(saved, 'utf8'))
  let last = ''
  for (const url of OVERPASS) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(QUERY)}`,
    })
    if (response.ok) return response.json()
    last = `${url}: ${response.status}`
    console.warn(last)
  }
  throw new Error(last)
}

const { elements } = await ask()

const features = []
for (const element of elements) {
  const tags = element.tags ?? {}
  const mw = megawatts(tags['plant:output:electricity'])
  const fuel = FUELS[String(tags['plant:source'] ?? '').split(';')[0]]
  const at = element.center ?? { lon: element.lon, lat: element.lat }
  if (mw === null || mw < MIN_MW || !fuel || at.lon === undefined) continue
  features.push({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [Number(at.lon.toFixed(4)), Number(at.lat.toFixed(4))] },
    properties: {
      id: `${element.type}/${element.id}`,
      name: tags['name:en'] ?? tags.name ?? '',
      fuel,
      mw: Number(mw.toFixed(1)),
    },
  })
}
features.sort((a, b) => b.properties.mw - a.properties.mw)

await mkdir(dirname(OUT), { recursive: true })
const text = `{"type":"FeatureCollection","features":[\n${features.map((f) => JSON.stringify(f)).join(',\n')}\n]}\n`
await writeFile(OUT, text)
console.log(`${features.length} plants of ${MIN_MW} MW and up: ${(text.length / 1024).toFixed(0)} kB`)
