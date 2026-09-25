import { loadRecord, type RecordAdapter } from './record'

const adapter: RecordAdapter = { area: 'tokyo', file: (m) => `x-${m}.csv`, parse: () => new Map([['d', []]]) }

afterEach(() => vi.unstubAllGlobals())

test('a month is fetched by the adapter file name and parsed by it', async () => {
  const fetch = vi.fn(() => Promise.resolve(new Response('csv')))
  vi.stubGlobal('fetch', fetch)
  expect(await loadRecord(adapter, '202609')).toEqual(new Map([['d', []]]))
  expect(fetch).toHaveBeenCalledWith('/data/x-202609.csv')
})

test('a month not on the host is no record, other failures are errors', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 404 })))
  expect(await loadRecord(adapter, '202608')).toBeNull()
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 500 })))
  await expect(loadRecord(adapter, '202608')).rejects.toThrow('500')
})
