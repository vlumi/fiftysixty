import { AREA_BY_ID, PRICED_AREAS } from './areas'
import { INTERCONNECTORS, neighbors } from './interconnectors'

test('every line joins two priced areas and every priced area has a line', () => {
  for (const { ends } of INTERCONNECTORS) {
    expect(ends[0]).not.toBe(ends[1])
    for (const end of ends) expect(AREA_BY_ID[end]).toBeDefined()
    expect(ends).not.toContain('okinawa')
  }
  for (const area of PRICED_AREAS) expect(neighbors(area.id).length).toBeGreaterThan(0)
  expect(neighbors('okinawa')).toEqual([])
})

test('neighbors are read from either end', () => {
  expect(neighbors('tokyo')).toEqual(['tohoku', 'chubu'])
  expect(neighbors('kansai')).toEqual(['chubu', 'hokuriku', 'chugoku', 'shikoku'])
})

test('the only line across the middle is the converters', () => {
  const across = INTERCONNECTORS.filter(({ ends }) => AREA_BY_ID[ends[0]].hz !== AREA_BY_ID[ends[1]].hz)
  expect(across.map((l) => l.link)).toEqual(['converter'])
})
