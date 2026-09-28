import { SERIES, type Series } from '../market/stack'
import { readItem, storage, writeItem } from '../shared/storage'

/** What the map draws over the areas besides the plants: the flows' arrows and the mix columns. */
export type MapLayer = 'flows' | 'mixes'
export type LayerChoice = Record<MapLayer, boolean>

export const MAP_LAYERS: readonly MapLayer[] = ['flows', 'mixes']

export const DEFAULT_LAYERS: LayerChoice = { flows: true, mixes: true }

const KEY = 'fiftysixty.layers'

/** The kept choice, the layers left out of it as by default. */
export function loadLayerChoice(store = storage()): LayerChoice {
  const raw = readItem(KEY, store)
  if (!raw) return DEFAULT_LAYERS
  try {
    const kept = JSON.parse(raw) as Partial<Record<string, unknown>>
    return Object.fromEntries(
      MAP_LAYERS.map((l) => [l, typeof kept[l] === 'boolean' ? kept[l] : DEFAULT_LAYERS[l]]),
    ) as LayerChoice
  } catch {
    return DEFAULT_LAYERS
  }
}

export function saveLayerChoice(choice: LayerChoice, store = storage()): void {
  const asDefault = MAP_LAYERS.every((l) => choice[l] === DEFAULT_LAYERS[l])
  writeItem(KEY, asDefault ? null : JSON.stringify(choice), store)
}

const PLANTS_KEY = 'fiftysixty.plants'

/** The fuels whose plants are hidden; every fuel by default, which is the plants off, since they crowd the columns until asked for. */
export function loadHiddenFuels(store = storage()): Series[] {
  const raw = readItem(PLANTS_KEY, store)
  if (!raw) return [...SERIES]
  try {
    const kept = JSON.parse(raw) as unknown
    return Array.isArray(kept) ? SERIES.filter((s) => kept.includes(s)) : [...SERIES]
  } catch {
    return [...SERIES]
  }
}

export function saveHiddenFuels(hidden: readonly Series[], store = storage()): void {
  writeItem(PLANTS_KEY, hidden.length === SERIES.length ? null : JSON.stringify(hidden), store)
}
