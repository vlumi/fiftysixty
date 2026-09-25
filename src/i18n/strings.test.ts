import { loadLang, saveLang, STRINGS } from './strings'

const keys = (o: unknown, prefix = ''): string[] =>
  o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}${k}.`)) : [prefix.slice(0, -1)]

test('both languages carry the same keys, and no word is left empty', () => {
  expect(keys(STRINGS.ja)).toEqual(keys(STRINGS.en))
  const values = (o: unknown): unknown[] => (o && typeof o === 'object' ? Object.values(o).flatMap(values) : [o])
  for (const v of values(STRINGS.ja)) if (typeof v === 'string') expect(v).not.toBe('')
  expect(STRINGS.ja.time.daysAgo(3)).toBe('3日前')
  expect(STRINGS.en.key.count(1)).toBe('1 plant')
  expect(STRINGS.en.key.count(2)).toBe('2 plants')
})

test('the language is the stored choice, else the browser, else English', () => {
  const held = new Map<string, string>()
  const store = {
    getItem: (k: string) => held.get(k) ?? null,
    setItem: (k: string, v: string) => void held.set(k, v),
  } as unknown as Storage
  expect(loadLang(store, 'ja-JP')).toBe('ja')
  expect(loadLang(store, 'fi-FI')).toBe('en')
  saveLang('ja', store)
  expect(loadLang(store, 'en-US')).toBe('ja')
  expect(loadLang(null, 'en')).toBe('en')
})
