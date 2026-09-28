import { loadRegions } from './geometry'

afterEach(() => vi.unstubAllGlobals())

test('the areas, the split line and the borders are fetched from the geometry directory', async () => {
  const fetch = vi.fn((url: string) =>
    Promise.resolve(new Response(JSON.stringify({ type: 'FeatureCollection', features: [], url }))),
  )
  vi.stubGlobal('fetch', fetch)
  const regions = await loadRegions()
  expect(fetch.mock.calls.map((c) => c[0])).toEqual([
    '/geo/areas.geojson',
    '/geo/split.geojson',
    '/geo/borders.geojson',
  ])
  expect(regions.areas.features).toEqual([])
  expect(regions.split.features).toEqual([])
  expect(regions.borders.features).toEqual([])
})

test('a missing file is an error, not empty regions', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
  await expect(loadRegions()).rejects.toThrow('/geo/areas.geojson: 404')
})
