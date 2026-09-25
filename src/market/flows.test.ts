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

test('noon on the holiday: the Kansai–Chugoku circuits summed and full toward Kansai, the market split there', () => {
  const at = flowsAt(days, '2026-09-23', 24)
  const kc = at.get('kansai-chugoku')!
  expect(kc.capacityMW).toEqual({ forward: 6580, reverse: 6580 })
  expect(kc.flowMW).toBe(-6580)
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
