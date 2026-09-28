import type { Area } from '../regions/areas'
import { capacityOf, load, type FlowSlot } from './flows'
import type { RecordSlot } from './record'

/** A flow the numbers give on one line: from where the power comes to where it goes. */
export interface Link {
  kind: 'link'
  id: string
  from: Area
  to: Area
  /** MW, positive along from → to. */
  mw: number
  /** The line's operating capacity the way it flows, when OCCTO's file for the day is there. */
  capacityMW?: number
  /** How full the line is, 0 to 1; 0 without a capacity. */
  load: number
  /** Whether the day-ahead market split across the line, from OCCTO. */
  split: boolean
}

/**
 * Three areas in a loop, where the numbers give each area's total across its two loop lines but not how it divides
 * between them. Drawn as a fork on the one area that takes in while the others send, or sends while they take in.
 */
export interface Fork {
  kind: 'fork'
  id: string
  /** Each area's total across its two lines of the loop, MW, positive in. */
  totals: Partial<Record<Area, number>>
  /** The area the fork points into or out of. */
  focus: Area
  others: [Area, Area]
  into: boolean
  mw: number
}

/**
 * The flows between the areas for one half hour, all of one kind: recorded, from the companies' own records of what
 * crossed their borders, when all nine are in; else planned, from OCCTO's reserve-margin file, which sets a flow per
 * block of similar days and is never revised to what happened.
 */
export interface Interchange {
  source: 'recorded' | 'planned'
  links: Link[]
  forks: Fork[]
}

/** OCCTO's fences around the Chubu, Hokuriku and Kansai loop; forward runs out of Chubu and into the others. */
const FENCES: { area: Area; id: string; forwardIn: boolean }[] = [
  { area: 'chubu', id: 'chubu-fence', forwardIn: false },
  { area: 'hokuriku', id: 'hokuriku-fence', forwardIn: true },
  { area: 'kansai', id: 'kansai-fence', forwardIn: true },
]

/** OCCTO's lines with their forward direction: the four on no loop, then the Kansai–Chugoku–Shikoku loop's, which the plan gives line by line. */
const LINES: { id: string; from: Area; to: Area }[] = [
  { id: 'kitahon', from: 'hokkaido', to: 'tohoku' },
  { id: 'tohoku-tokyo', from: 'tohoku', to: 'tokyo' },
  { id: 'fc', from: 'tokyo', to: 'chubu' },
  { id: 'chugoku-kyushu', from: 'chugoku', to: 'kyushu' },
  { id: 'kansai-chugoku', from: 'kansai', to: 'chugoku' },
  { id: 'kansai-shikoku', from: 'kansai', to: 'shikoku' },
  { id: 'chugoku-shikoku', from: 'chugoku', to: 'shikoku' },
]

/** Below this a total counts as none, so rounding in the records does not make a fork of nothing. */
const NONE_MW = 1

/** The areas whose records the recorded kind needs: every one with an interconnector. */
export const RECORDED_AREAS: readonly Area[] = [
  'hokkaido',
  'tohoku',
  'tokyo',
  'chubu',
  'hokuriku',
  'kansai',
  'chugoku',
  'shikoku',
  'kyushu',
]

function link(id: string, from: Area, to: Area, forwardMW: number, flows: ReadonlyMap<string, FlowSlot>): Link {
  const [a, b, mw] = forwardMW >= 0 ? [from, to, forwardMW] : [to, from, -forwardMW]
  const at = flows.get(id)
  // The capacity the way the power went, which for a recorded flow may not be the way OCCTO planned it.
  const facing = at && { ...at, flowMW: forwardMW }
  return {
    kind: 'link',
    id,
    from: a,
    to: b,
    mw,
    capacityMW: facing ? capacityOf(facing) : undefined,
    load: facing ? load(facing) : 0,
    split: at?.split ?? false,
  }
}

/** The fork for a loop's three totals: on the one area taking in, or else the one sending; none when nothing moves. */
export function forkOf(id: string, totals: Record<string, number>): Fork | null {
  const areas = Object.keys(totals) as Area[]
  const inward = areas.filter((a) => totals[a] > NONE_MW)
  const outward = areas.filter((a) => totals[a] < -NONE_MW)
  const [focus, into] =
    inward.length === 1 ? [inward[0], true] : outward.length === 1 ? [outward[0], false] : [null, true]
  if (!focus) return null
  return {
    kind: 'fork',
    id,
    totals,
    focus,
    others: areas.filter((a) => a !== focus) as [Area, Area],
    into,
    mw: Math.abs(totals[focus]),
  }
}

/** OCCTO's plan for the half hour: its lines as they are, and the Chubu, Hokuriku and Kansai loop from its fences. */
export function planned(flows: ReadonlyMap<string, FlowSlot>): Interchange {
  const links = LINES.flatMap(({ id, from, to }) => {
    const at = flows.get(id)
    return at && at.flowMW !== 0 ? [link(id, from, to, at.flowMW, flows)] : []
  })
  const fences = FENCES.map(({ area, id, forwardIn }) => {
    const at = flows.get(id)
    return at && ([area, forwardIn ? at.flowMW : -at.flowMW] as const)
  })
  const fork = fences.every(Boolean)
    ? forkOf('chubu-hokuriku-kansai', Object.fromEntries(fences as [Area, number][]))
    : null
  return { source: 'planned', links, forks: fork ? [fork] : [] }
}

/**
 * The flows the nine records settle: the four lines no loop runs through, exactly, and for each loop every area's
 * total across its two loop lines, which is all the numbers say about a loop. Null when a record is missing.
 */
export function recorded(
  records: Partial<Record<Area, RecordSlot | null>>,
  flows: ReadonlyMap<string, FlowSlot>,
): Interchange | null {
  const into = {} as Record<Area, number>
  for (const area of RECORDED_AREAS) {
    const at = records[area]
    if (!at) return null
    into[area] = at.bySource.interconnector
  }
  const kitahon = -into.hokkaido
  const tohokuTokyo = kitahon - into.tohoku
  const fc = tohokuTokyo - into.tokyo
  const kanmon = into.kyushu
  const links = [
    link('kitahon', 'hokkaido', 'tohoku', kitahon, flows),
    link('tohoku-tokyo', 'tohoku', 'tokyo', tohokuTokyo, flows),
    link('fc', 'tokyo', 'chubu', fc, flows),
    link('chugoku-kyushu', 'chugoku', 'kyushu', kanmon, flows),
  ].filter((l) => l.mw > 0)
  const east = { chubu: into.chubu - fc, hokuriku: into.hokuriku }
  const west = { chugoku: into.chugoku + kanmon, shikoku: into.shikoku }
  const forks = [
    forkOf('chubu-hokuriku-kansai', { ...east, kansai: -(east.chubu + east.hokuriku) }),
    forkOf('kansai-chugoku-shikoku', { kansai: -(west.chugoku + west.shikoku), ...west }),
  ].filter((f): f is Fork => f !== null)
  return { source: 'recorded', links, forks }
}

/** The half hour's flows: recorded when every record is in, else OCCTO's plan. */
export function interchangeAt(
  records: Partial<Record<Area, RecordSlot | null>>,
  flows: ReadonlyMap<string, FlowSlot>,
): Interchange {
  return recorded(records, flows) ?? planned(flows)
}
