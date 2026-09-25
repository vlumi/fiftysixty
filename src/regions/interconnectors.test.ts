import { AREA_BY_ID, PRICED_AREAS } from './areas'
import { INTERCONNECTORS, neighbors, OCCTO_LINES } from './interconnectors'

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

test("OCCTO's lines join the areas, the fences the triangle to the middle, and every priced area has a line", () => {
  const ids = new Set(OCCTO_LINES.map((l) => l.id))
  expect(ids.size).toBe(10)
  for (const line of OCCTO_LINES) {
    for (const end of [line.from, line.to]) if (end !== 'middle') expect(AREA_BY_ID[end]).toBeDefined()
    if (line.id.endsWith('fence')) expect([line.from, line.to]).toContain('middle')
  }
  for (const area of PRICED_AREAS) expect(OCCTO_LINES.some((l) => l.from === area.id || l.to === area.id)).toBe(true)
})
