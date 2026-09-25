import { readItem, storage, writeItem } from './storage'
import { useMediaQuery } from './useMediaQuery'

export type Theme = 'light' | 'dark'
/** What the reader chose; `system` follows the operating system's preference. */
export type ThemeChoice = Theme | 'system'

export const BASEMAPS: Record<Theme, string> = {
  dark: 'https://tiles.openfreemap.org/styles/fiord',
  light: 'https://tiles.openfreemap.org/styles/positron',
}

/** Each style's first label layer; the market layers are interleaved beneath it so the place names stay legible. */
export const BELOW_LABELS: Record<Theme, string> = {
  dark: 'water_name',
  light: 'waterway_line_label',
}

export function resolveTheme(choice: ThemeChoice, systemDark: boolean): Theme {
  return choice === 'system' ? (systemDark ? 'dark' : 'light') : choice
}

const KEY = 'fiftysixty.theme'

export function loadThemeChoice(store = storage()): ThemeChoice {
  const raw = readItem(KEY, store)
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}

export function saveThemeChoice(choice: ThemeChoice, store = storage()): void {
  writeItem(KEY, choice === 'system' ? null : choice, store)
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Whether the operating system asks for dark; true where matchMedia is unavailable, since the site is dark by default. */
export const useSystemDark = () => useMediaQuery(DARK_QUERY, true)
