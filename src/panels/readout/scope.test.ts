import { inScope, pickKey, scopeAreas, scopeHz, scopeOf } from './scope'

const plant = { id: 'way/1', name: 'Kashiwazaki-Kariwa', fuel: 'nuclear' as const, mw: 8212 }

test('a plant over an area, Okinawa apart, a half only with nothing picked, else the system', () => {
  expect(scopeOf('tokyo', plant, 50)).toEqual({ kind: 'plant', plant })
  expect(scopeOf('okinawa', null, 60)).toEqual({ kind: 'okinawa' })
  expect(scopeOf('tokyo', null, 60)).toEqual({ kind: 'area', area: 'tokyo' })
  expect(scopeOf(null, null, 60)).toEqual({ kind: 'half', half: 60 })
  expect(scopeOf(null, null, null)).toEqual({ kind: 'system' })
})

test('what lies inside the scope, and the half it is in', () => {
  const tokyo = scopeOf('tokyo', null, null)
  expect(inScope(tokyo, 'tokyo')).toBe(true)
  expect(inScope(tokyo, 'chubu')).toBe(false)
  const east = scopeOf(null, null, 50)
  expect(inScope(east, 'tokyo')).toBe(true)
  expect(inScope(east, 'chubu')).toBe(false)
  expect(inScope(scopeOf(null, null, null), 'kyushu')).toBe(true)
  expect(inScope(scopeOf(null, plant, null), 'tokyo')).toBe(false)
  expect(scopeHz(tokyo)).toBe(50)
  expect(scopeHz(east)).toBe(50)
  expect(scopeHz(scopeOf(null, null, null))).toBeNull()
  expect(scopeAreas(east)).toEqual(['hokkaido', 'tohoku', 'tokyo'])
  expect(scopeAreas(scopeOf('okinawa', null, null))).toEqual([])
})

test('a pick opens the panel for itself, a half for the system', () => {
  expect(pickKey(scopeOf('tokyo', null, null))).toBe('tokyo')
  expect(pickKey(scopeOf(null, plant, null))).toBe('plant/way/1')
  expect(pickKey(scopeOf(null, null, 50))).toBe('system')
  expect(pickKey(scopeOf(null, null, null))).toBe('system')
})
