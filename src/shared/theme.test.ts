import { loadThemeChoice, resolveTheme, saveThemeChoice } from './theme'

test('a choice resolves to a theme, system following the operating system', () => {
  expect(resolveTheme('system', true)).toBe('dark')
  expect(resolveTheme('system', false)).toBe('light')
  expect(resolveTheme('light', true)).toBe('light')
})

test('the choice round-trips through storage, system leaving nothing behind', () => {
  const held = new Map<string, string>()
  const store = {
    getItem: (k: string) => held.get(k) ?? null,
    setItem: (k: string, v: string) => void held.set(k, v),
    removeItem: (k: string) => void held.delete(k),
  } as unknown as Storage
  expect(loadThemeChoice(store)).toBe('system')
  saveThemeChoice('light', store)
  expect(loadThemeChoice(store)).toBe('light')
  saveThemeChoice('system', store)
  expect(held.size).toBe(0)
  expect(loadThemeChoice(null)).toBe('system')
})
