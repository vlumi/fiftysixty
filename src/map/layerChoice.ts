import { readItem, storage, writeItem } from '../shared/storage'

/** What the map draws over the areas: the flows' arrows, the mix columns and the plants. */
export type MapLayer = 'flows' | 'mixes' | 'plants'
export type LayerChoice = Record<MapLayer, boolean>

export const MAP_LAYERS: readonly MapLayer[] = ['flows', 'mixes', 'plants']

/** The arrows and the columns on, the plants off: they crowd the columns until asked for. */
export const DEFAULT_LAYERS: LayerChoice = { flows: true, mixes: true, plants: false }

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
