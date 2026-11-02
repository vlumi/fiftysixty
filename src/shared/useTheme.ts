import { useApp } from '../store'
import { resolveTheme, useSystemDark, type Theme } from './theme'

/** The theme in force: the reader's choice, or the operating system's. */
export function useTheme(): Theme {
  const choice = useApp((s) => s.themeChoice)
  return resolveTheme(choice, useSystemDark())
}
