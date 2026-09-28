import { resetApp, useApp } from './store'

beforeEach(resetApp)

test('the day starts at noon on the newest day with nothing selected', () => {
  expect(useApp.getState()).toMatchObject({ date: null, slot: 25, area: null })
})

test('the slot is kept in the day', () => {
  useApp.getState().setSlot(60)
  expect(useApp.getState().slot).toBe(48)
  useApp.getState().setSlot(-3)
  expect(useApp.getState().slot).toBe(1)
})

test('a day and an area are chosen and cleared', () => {
  useApp.getState().setDate('2026-09-25')
  useApp.getState().selectArea('kyushu')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-25', area: 'kyushu' })
  useApp.getState().setDate(null)
  useApp.getState().selectArea(null)
  expect(useApp.getState()).toMatchObject({ date: null, area: null })
})

test('play steps the half hours, runs on into the next priced day, and stops at the end of the data', () => {
  const days = ['2026-09-25', '2026-09-26']
  useApp.getState().setDate('2026-09-25')
  useApp.getState().setSlot(47)
  useApp.getState().togglePlay()
  expect(useApp.getState().playing).toBe(true)
  useApp.getState().step(days, '2026-09-25')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-25', slot: 48, playing: true })
  useApp.getState().step(days, '2026-09-25')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-26', slot: 1, playing: true })
  useApp.setState({ slot: 48 })
  useApp.getState().step(days, '2026-09-26')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-26', slot: 48, playing: false })
})

test('a day or a half hour chosen by hand pauses the playback', () => {
  useApp.getState().togglePlay()
  useApp.getState().setSlot(10)
  expect(useApp.getState().playing).toBe(false)
  useApp.getState().togglePlay()
  useApp.getState().setDate('2026-09-25')
  expect(useApp.getState().playing).toBe(false)
})

test('play from a day the data does not hold stops at its end rather than jumping to the oldest day', () => {
  useApp.getState().setDate('2026-09-24')
  useApp.getState().setSlot(48)
  useApp.getState().togglePlay()
  useApp.getState().step(['2026-09-22', '2026-09-25'], '2026-09-24')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-24', slot: 48, playing: false })
})

test('a plant and an area are picked in turn, each letting the other go', () => {
  useApp.getState().selectArea('kyushu')
  useApp.getState().pickPlant('way/1')
  expect(useApp.getState()).toMatchObject({ area: null, plant: 'way/1' })
  useApp.getState().selectArea('tokyo')
  expect(useApp.getState()).toMatchObject({ area: 'tokyo', plant: null })
})

test('every fuel starts hidden; a fuel is shown and hidden again, and the list is kept for the next visit', () => {
  expect(useApp.getState().hiddenFuels).toHaveLength(8)
  useApp.getState().setHiddenFuels([])
  useApp.getState().toggleFuel('coal')
  useApp.getState().toggleFuel('gas')
  expect(useApp.getState().hiddenFuels).toEqual(['coal', 'gas'])
  expect(JSON.parse(localStorage.getItem('fiftysixty.plants')!)).toEqual(['coal', 'gas'])
  useApp.getState().toggleFuel('coal')
  expect(useApp.getState().hiddenFuels).toEqual(['gas'])
  useApp.getState().setHiddenFuels([])
  expect(JSON.parse(localStorage.getItem('fiftysixty.plants')!)).toEqual([])
  localStorage.clear()
})

test('a layer is switched off and on, and the choice is kept for the next visit', () => {
  useApp.getState().toggleLayer('flows')
  expect(useApp.getState().layers).toEqual({ flows: false, mixes: true })
  expect(JSON.parse(localStorage.getItem('fiftysixty.layers')!)).toEqual({ flows: false, mixes: true })
  useApp.getState().toggleLayer('flows')
  expect(localStorage.getItem('fiftysixty.layers')).toBeNull()
})

test('the theme choice is kept for the next visit', () => {
  useApp.getState().setThemeChoice('light')
  expect(localStorage.getItem('fiftysixty.theme')).toBe('light')
  useApp.getState().setThemeChoice('system')
  expect(localStorage.getItem('fiftysixty.theme')).toBeNull()
})

test('the language is kept for the next visit', () => {
  useApp.getState().setLang('ja')
  expect(localStorage.getItem('fiftysixty.lang')).toBe('ja')
  useApp.getState().setLang('en')
})
