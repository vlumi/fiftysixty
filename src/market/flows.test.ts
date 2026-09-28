import csv from '../test/fixtures/occto-renkei.csv?raw'
import { flowsAt, load, parseFlows } from './flows'

const days = parseFlows(csv)

test('three real half hours parse into the ten lines by id, the time naming the end of the half hour', () => {
  expect([...days.keys()]).toEqual(['2026-09-23'])
  const lines = days.get('2026-09-23')!
  expect([...lines.keys()].sort()).toEqual(
    [
      'chubu-fence',
      'chugoku-kyushu',
      'chugoku-shikoku',
      'fc',
      'hokuriku-fence',
      'kansai-chugoku',
      'kansai-fence',
      'kansai-shikoku',
      'kitahon',
      'tohoku-tokyo',
    ].sort(),
  )
  expect(lines.get('kitahon')!.map((s) => s.slot)).toEqual([23, 24, 25])
})

test('noon on the holiday: Kansai–Chugoku once, not its two sections summed, full toward Kansai and split at one section', () => {
  const at = flowsAt(days, '2026-09-23', 24)
  const kc = at.get('kansai-chugoku')!
  expect(kc.capacityMW).toEqual({ forward: 3290, reverse: 3290 })
  expect(kc.flowMW).toBe(-3290)
  expect(kc.split).toBe(true)
  expect(load(kc)).toBe(1)
  const kitahon = at.get('kitahon')!
  expect(kitahon).toEqual({
    slot: 24,
    capacityMW: { forward: 600, reverse: 600 },
    flowMW: 300,
    freeMW: { forward: 50, reverse: 340 },
    split: false,
  })
  expect(load(kitahon)).toBe(0.5)
})

test('a line with no capacity the way it flows counts as unloaded, and a missing day is empty', () => {
  expect(
    load({
      slot: 1,
      capacityMW: { forward: 0, reverse: 550 },
      flowMW: 10,
      freeMW: { forward: 0, reverse: 0 },
      split: false,
    }),
  ).toBe(0)
  expect(flowsAt(days, '2026-09-24', 24).size).toBe(0)
  expect(flowsAt(null, '2026-09-23', 24).size).toBe(0)
})

test('a file without the header is refused', () => {
  expect(() => parseFlows('"2026/09/21 18:03 UPDATE"\n"x","y"')).toThrow('header')
})

test("where Kansai–Chugoku's two sections differ, the tighter one's capacity and free capacity bind", () => {
  const header = csv.split(/\r?\n/).slice(0, 2).join('\n')
  const row = (section: string, reverse: number, free: number) =>
    `"2026/09/29","***","24:00","関西-中国（${section}）","3290","${reverse}","0","0","-2952","2952","6242","${free}","0","0","0","分断なし","分断なし"`
  const [kc] = parseFlows([header, row('東', 4650, 1698), row('西', 3290, 338)].join('\n'))
    .get('2026-09-29')!
    .get('kansai-chugoku')!
  expect(kc).toMatchObject({ flowMW: -2952, capacityMW: { forward: 3290, reverse: 3290 }, freeMW: { reverse: 338 } })
})
