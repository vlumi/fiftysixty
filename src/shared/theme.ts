import { useEffect, useState } from 'react'

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

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadThemeChoice(store = storage()): ThemeChoice {
  try {
    const raw = store?.getItem(KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemeChoice(choice: ThemeChoice, store = storage()): void {
  try {
    if (choice === 'system') store?.removeItem(KEY)
    else store?.setItem(KEY, choice)
  } catch {
    // Storage full or forbidden: the choice lives on for this visit only.
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Whether the operating system asks for dark; true where matchMedia is unavailable, since the site is dark by default. */
export function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia?.(DARK_QUERY).matches ?? true)
  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY)
    if (!media) return
    const onChange = () => setDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return dark
}
