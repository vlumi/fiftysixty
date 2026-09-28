import type { Strings } from './i18n/strings'
import { AREAS } from './regions/areas'
import type { Theme } from './shared/theme'
import { useApp } from './store'
import { jstDate, slotNow } from './time/days'

/** The keyboard scheme, in one place: the handler dispatches on it and the about modal lists it, `does` naming a help string. */
export const SHORTCUTS: { keys: string; does: keyof Strings['help'] }[] = [
  { keys: '← →', does: 'slot' },
  { keys: 'Shift ← →', does: 'day' },
  { keys: '↑ ↓', does: 'area' },
  { keys: 'Space', does: 'playPause' },
  { keys: 'N', does: 'now' },
  { keys: 'T', does: 'theme' },
  { keys: 'Esc', does: 'escape' },
  { keys: '?', does: 'about' },
]

const FORM_FIELDS = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

/** Whether a key event should be left to the element that has focus rather than handled globally. */
export function belongsToFocusedControl(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  if (!target || !target.tagName) return false
  if (FORM_FIELDS.has(target.tagName) || target.isContentEditable) return true
  if (target.getAttribute('role') === 'slider' && event.key.startsWith('Arrow')) return true
  return target.tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')
}

/**
 * After a pointer click on a button or the slider, drop focus so the global shortcuts keep working; keyboard
 * activation (`detail` 0) keeps focus where the keyboard user put it.
 */
export function releaseFocusAfterPointerClick(event: MouseEvent): void {
  if (event.detail === 0) return
  const control = (event.target as Element | null)?.closest<HTMLElement>('button, input[type="range"]')
  control?.blur()
}

interface ShortcutContext {
  /** The priced days in order, which Shift and an arrow step through. */
  days: readonly string[]
  /** The displayed day. */
  date: string | null
  now: Date
  theme: Theme
  /** With a modal open, Escape is the modal's, and the rest wait. */
  modal: boolean
  onAbout: () => void
}

/** Acts on a key press against the store; true when the key was one of ours and the browser should not also act. */
export function dispatchShortcut(
  e: KeyboardEvent,
  { days, date, now, theme, modal, onAbout }: ShortcutContext,
): boolean {
  if (belongsToFocusedControl(e) || e.metaKey || e.ctrlKey || e.altKey || modal) return false
  const s = useApp.getState()
  const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowRight': {
      if (!e.shiftKey) {
        s.setSlot(s.slot + step)
        return true
      }
      const at = date ? days.indexOf(date) : -1
      const next = days[at + step]
      if (at >= 0 && next) s.setDate(next)
      return true
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const at = AREAS.findIndex((a) => a.id === s.area)
      const to = at < 0 ? (step > 0 ? 0 : AREAS.length - 1) : Math.max(0, Math.min(AREAS.length - 1, at + step))
      s.selectArea(AREAS[to].id)
      return true
    }
    case ' ':
      s.togglePlay()
      return true
    case 'n':
    case 'N': {
      const today = jstDate(now)
      if (!days.includes(today)) return false
      s.setDate(today)
      s.setSlot(slotNow(now))
      return true
    }
    case 't':
    case 'T':
      s.setThemeChoice(theme === 'light' ? 'dark' : 'light')
      return true
    case 'Escape':
      if (s.plant) s.pickPlant(null)
      else if (s.area) s.selectArea(null)
      else return false
      return true
    case '?':
      onAbout()
      return true
    default:
      return false
  }
}
