import { resetApp, useApp } from './store'
import { belongsToFocusedControl, dispatchShortcut, releaseFocusAfterPointerClick } from './shortcuts'

const days = ['2026-09-24', '2026-09-25', '2026-09-26']
const context = {
  days,
  date: '2026-09-25',
  now: new Date('2026-09-26T10:00:00+09:00'),
  theme: 'dark' as const,
  modal: false,
  onAbout: vi.fn(),
}
const press = (key: string, init: KeyboardEventInit = {}) => new KeyboardEvent('keydown', { key, ...init })
const state = () => useApp.getState()

beforeEach(() => {
  resetApp()
  context.onAbout.mockClear()
})

test('the arrows step the half hour, and with Shift the day, within the priced days', () => {
  expect(dispatchShortcut(press('ArrowRight'), context)).toBe(true)
  expect(state().slot).toBe(26)
  dispatchShortcut(press('ArrowLeft'), context)
  dispatchShortcut(press('ArrowLeft'), context)
  expect(state().slot).toBe(24)
  dispatchShortcut(press('ArrowRight', { shiftKey: true }), context)
  expect(state().date).toBe('2026-09-26')
  dispatchShortcut(press('ArrowRight', { shiftKey: true }), { ...context, date: '2026-09-26' })
  expect(state().date).toBe('2026-09-26')
  dispatchShortcut(press('ArrowLeft', { shiftKey: true }), { ...context, date: '2026-09-26' })
  expect(state().date).toBe('2026-09-25')
})

test('up and down walk the areas from Hokkaido to Okinawa, and Escape lets the area, or a plant first, go', () => {
  dispatchShortcut(press('ArrowDown'), context)
  expect(state().area).toBe('hokkaido')
  dispatchShortcut(press('ArrowDown'), context)
  expect(state().area).toBe('tohoku')
  dispatchShortcut(press('ArrowUp'), context)
  dispatchShortcut(press('ArrowUp'), context)
  expect(state().area).toBe('hokkaido')
  state().selectArea(null)
  dispatchShortcut(press('ArrowUp'), context)
  expect(state().area).toBe('okinawa')
  state().pickPlant('way/1')
  expect(dispatchShortcut(press('Escape'), context)).toBe(true)
  expect(state().plant).toBeNull()
  state().selectArea('tokyo')
  dispatchShortcut(press('Escape'), context)
  expect(state().area).toBeNull()
  expect(dispatchShortcut(press('Escape'), context)).toBe(false)
})

test('Space plays, N goes to now when today is priced, T flips the theme, ? opens the about', () => {
  dispatchShortcut(press(' '), context)
  expect(state().playing).toBe(true)
  dispatchShortcut(press('n'), context)
  expect(state().date).toBe('2026-09-26')
  expect(state().slot).toBe(21)
  expect(dispatchShortcut(press('N'), { ...context, days: ['2026-09-20'] })).toBe(false)
  dispatchShortcut(press('t'), context)
  expect(state().themeChoice).toBe('light')
  dispatchShortcut(press('T'), { ...context, theme: 'light' })
  expect(state().themeChoice).toBe('dark')
  dispatchShortcut(press('?'), context)
  expect(context.onAbout).toHaveBeenCalled()
  localStorage.clear()
})

test('a modal, a modifier, a focused field or a plain other key are left alone', () => {
  expect(dispatchShortcut(press('Escape'), { ...context, modal: true })).toBe(false)
  expect(dispatchShortcut(press('ArrowRight', { metaKey: true }), context)).toBe(false)
  expect(dispatchShortcut(press('x'), context)).toBe(false)
  const input = document.createElement('input')
  document.body.append(input)
  const inField = new KeyboardEvent('keydown', { key: 'ArrowRight' })
  Object.defineProperty(inField, 'target', { value: input })
  expect(belongsToFocusedControl(inField)).toBe(true)
  const button = document.createElement('button')
  const onButton = (key: string) => {
    const e = new KeyboardEvent('keydown', { key })
    Object.defineProperty(e, 'target', { value: button })
    return belongsToFocusedControl(e)
  }
  expect(onButton('Enter')).toBe(true)
  expect(onButton('ArrowRight')).toBe(false)
  const slider = document.createElement('div')
  slider.setAttribute('role', 'slider')
  const onSlider = new KeyboardEvent('keydown', { key: 'ArrowRight' })
  Object.defineProperty(onSlider, 'target', { value: slider })
  expect(belongsToFocusedControl(onSlider)).toBe(true)
  input.remove()
})

test('a pointer click on a button lets its focus go, a keyboard activation keeps it', () => {
  const button = document.createElement('button')
  document.body.append(button)
  button.focus()
  const click = (detail: number) => {
    const e = new MouseEvent('click', { detail })
    Object.defineProperty(e, 'target', { value: button })
    releaseFocusAfterPointerClick(e)
  }
  click(0)
  expect(document.activeElement).toBe(button)
  click(1)
  expect(document.activeElement).not.toBe(button)
  button.remove()
})
