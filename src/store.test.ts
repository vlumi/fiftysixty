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
  useApp.getState().setSlot(48)
  useApp.getState().step(days, '2026-09-26')
  expect(useApp.getState()).toMatchObject({ date: '2026-09-26', slot: 48, playing: false })
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
