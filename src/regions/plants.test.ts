import fixture from '../test/fixtures/plants.geojson?raw'
import { loadPlants } from './plants'

afterEach(() => vi.unstubAllGlobals())

test('the plants are fetched from the geometry directory', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(fixture, { headers: { 'content-type': 'application/geo+json' } }))),
  )
  const plants = await loadPlants()
  expect(plants?.features.map((f) => f.properties.fuel)).toEqual(['coal', 'nuclear', 'solar', 'hydro'])
  expect(plants?.features[1].properties).toMatchObject({ name: 'Kashiwazaki-Kariwa Nuclear Power Plant', mw: 8212 })
})

test('no file, no plants', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
  expect(await loadPlants()).toBeNull()
})
