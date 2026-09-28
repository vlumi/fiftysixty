import type { Area } from '../regions/areas'
import type { FlowSlot } from './flows'
import { forkOf, interchangeAt, planned, recorded } from './interchange'
import type { RecordSlot } from './record'

const net = (interconnector: number) => ({ bySource: { interconnector } }) as unknown as RecordSlot
const nets = (n: Partial<Record<Area, number>>) =>
  Object.fromEntries(Object.entries(n).map(([a, v]) => [a, net(v!)])) as Record<Area, RecordSlot>
const slot = (flowMW: number, capacity = 2000, split = false): FlowSlot => ({
  slot: 25,
  capacityMW: { forward: capacity, reverse: capacity },
  flowMW,
  freeMW: { forward: 0, reverse: 0 },
  split,
})

// Hokkaido sends 300 south, Tohoku adds 1,000, Tokyo takes 2,000 and passes 700 on to Chubu; Kyushu sends 648 east.
const nine = nets({
  hokkaido: -300,
  tohoku: -1000,
  tokyo: 600,
  chubu: 900,
  hokuriku: -500,
  kansai: 1600,
  chugoku: -1300,
  shikoku: -652,
  kyushu: -648,
})

test('with all nine records, the four lines off the loops are exact, and each loop is its areas’ totals', () => {
  const x = recorded(nine, new Map([['chugoku-kyushu', slot(-1923, 2060, true)]]))!
  expect(x.source).toBe('recorded')
  expect(x.links.map((l) => [l.id, l.from, l.to, l.mw])).toEqual([
    ['kitahon', 'hokkaido', 'tohoku', 300],
    ['tohoku-tokyo', 'tohoku', 'tokyo', 1300],
    ['fc', 'tokyo', 'chubu', 700],
    ['chugoku-kyushu', 'kyushu', 'chugoku', 648],
  ])
  const kanmon = x.links[3]
  expect(kanmon).toMatchObject({ capacityMW: 2060, split: true })
  expect(kanmon.load).toBeCloseTo(648 / 2060)
  const [east, west] = x.forks
  // Chubu and Kansai both take in, so the fork runs out of Hokuriku, the one sending.
  expect(east).toMatchObject({
    totals: { chubu: 200, hokuriku: -500, kansai: 300 },
    focus: 'hokuriku',
    into: false,
    mw: 500,
  })
  // Chugoku's 648 from Kyushu is off the loop, so its loop total is its record less that.
  expect(west.totals).toEqual({ kansai: 2600, chugoku: -1948, shikoku: -652 })
  expect(west).toMatchObject({ focus: 'kansai', into: true, mw: 2600, others: ['chugoku', 'shikoku'] })
})

test('a missing record leaves the half hour to the plan, never a mix', () => {
  const { kyushu: _, ...eight } = nine
  expect(recorded(eight, new Map())).toBeNull()
  expect(interchangeAt(eight, new Map([['kitahon', slot(280)]])).source).toBe('planned')
  expect(interchangeAt(nine, new Map()).source).toBe('recorded')
})

test("the plan's lines as they are, and the Chubu, Hokuriku and Kansai loop as a fork from OCCTO's fences", () => {
  const x = planned(
    new Map([
      ['kitahon', slot(280)],
      ['kansai-chugoku', slot(-3605, 4600)],
      ['chubu-fence', slot(1830)],
      ['hokuriku-fence', slot(300)],
      ['kansai-fence', slot(1530)],
    ]),
  )
  expect(x.links.map((l) => [l.id, l.from, l.to, l.mw])).toEqual([
    ['kitahon', 'hokkaido', 'tohoku', 280],
    ['kansai-chugoku', 'chugoku', 'kansai', 3605],
  ])
  expect(x.forks).toHaveLength(1)
  expect(x.forks[0]).toMatchObject({ focus: 'chubu', into: false, mw: 1830, others: ['hokuriku', 'kansai'] })
})

test('a fork points into the one area taking in, or out of the one sending, and nothing moving is no fork', () => {
  expect(forkOf('x', { chubu: -900, hokuriku: -100, kansai: 1000 })).toMatchObject({
    focus: 'kansai',
    into: true,
    mw: 1000,
  })
  expect(forkOf('x', { chubu: -900, hokuriku: 0, kansai: 900 })).toMatchObject({ focus: 'kansai', into: true })
  expect(forkOf('x', { chubu: 0.4, hokuriku: -0.2, kansai: -0.2 })).toBeNull()
})
