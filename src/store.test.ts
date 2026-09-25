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
