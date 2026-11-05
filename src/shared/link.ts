import { AREAS, type Area, type Hz } from '../regions/areas'
import { SLOTS } from '../market/jepx'
import type { View } from '../store'

/** What a link carries: where the reader stands in the data and what the readout is about, nothing kept for a visit. */
export interface LinkState {
  date: string | null
  slot: number
  area: Area | null
  plant: string | null
  half: Hz | null
  view: View
}

const VIEWS: readonly View[] = ['slot', 'day', 'history']
const AREA_IDS: readonly string[] = AREAS.map((a) => a.id)

/** The choices a query string names, each only where it is well formed; the rest keep their defaults. */
export function parseLink(search: string): Partial<LinkState> {
  const q = new URLSearchParams(search)
  const out: Partial<LinkState> = {}
  const day = q.get('day')
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) out.date = day
  const slot = Number(q.get('slot'))
  if (Number.isInteger(slot) && slot >= 1 && slot <= SLOTS) out.slot = slot
  const area = q.get('area')
  if (area && AREA_IDS.includes(area)) out.area = area as Area
  const plant = q.get('plant')
  if (plant) out.plant = plant
  const half = q.get('half')
  if (half === '50' || half === '60') out.half = Number(half) as Hz
  const view = q.get('view')
  if (view && VIEWS.includes(view as View)) out.view = view as View
  return out
}

/** The query string for the choices, empty when every one is the default, so the opening view has a plain address. */
export function formatLink(state: LinkState): string {
  const q = new URLSearchParams()
  if (state.date) q.set('day', state.date)
  if (state.slot !== 25) q.set('slot', String(state.slot))
  if (state.plant) q.set('plant', state.plant)
  else if (state.area) q.set('area', state.area)
  if (state.half && !state.area && !state.plant) q.set('half', String(state.half))
  if (state.view !== 'slot') q.set('view', state.view)
  const text = q.toString()
  return text ? `?${text}` : ''
}
