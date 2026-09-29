import { create } from 'zustand'
import type { Area } from './regions/areas'
import { clampSlot } from './time/slots'
import { SLOTS } from './market/jepx'
import type { Series } from './market/stack'
import { loadLang, saveLang, type Lang } from './i18n/strings'
import { loadThemeChoice, saveThemeChoice, type ThemeChoice } from './shared/theme'
import {
  loadHiddenFuels,
  loadLayerChoice,
  saveHiddenFuels,
  saveLayerChoice,
  type LayerChoice,
  type MapLayer,
} from './map/layerChoice'

/** What the reader has chosen: the delivery day (null for the opening day), the half hour, the area or a plant, and whether the day plays. */
interface State {
  date: string | null
  slot: number
  area: Area | null
  /** A picked plant, by its OpenStreetMap id; picking one lets the area go, and the other way round. */
  plant: string | null
  playing: boolean
  /** Whether the map draws the arrows and the columns. */
  layers: LayerChoice
  /** The readout's figures for the displayed half hour or for its whole day. */
  view: 'slot' | 'day'
  /** The fuels whose plants are hidden from the map; every fuel hidden is the plants off. */
  hiddenFuels: Series[]
  themeChoice: ThemeChoice
  lang: Lang
}

interface Actions {
  setDate: (date: string | null) => void
  setSlot: (slot: number) => void
  selectArea: (area: Area | null) => void
  pickPlant: (plant: string | null) => void
  toggleLayer: (layer: MapLayer) => void
  setView: (view: 'slot' | 'day') => void
  toggleFuel: (fuel: Series) => void
  setHiddenFuels: (fuels: Series[]) => void
  setThemeChoice: (choice: ThemeChoice) => void
  setLang: (lang: Lang) => void
  togglePlay: () => void
  /** One half hour on from the displayed day; past the last, on to the next priced day, or a stop at the end of the data. */
  step: (days: readonly string[], displayed: string | null) => void
}

const initial = (): State => ({
  date: null,
  slot: 25,
  area: null,
  plant: null,
  playing: false,
  layers: loadLayerChoice(),
  view: 'slot',
  hiddenFuels: loadHiddenFuels(),
  themeChoice: loadThemeChoice(),
  lang: loadLang(),
})

export const useApp = create<State & Actions>((set) => ({
  ...initial(),
  // A day or a half hour chosen by hand pauses the playback, which otherwise would run on from it.
  setDate: (date) => set({ date, playing: false }),
  setSlot: (slot) => set({ slot: clampSlot(slot), playing: false }),
  selectArea: (area) => set({ area, plant: null }),
  pickPlant: (plant) => set({ plant, area: null }),
  setHiddenFuels: (hiddenFuels) => set({ hiddenFuels }),
  setThemeChoice: (themeChoice) => set({ themeChoice }),
  setLang: (lang) => set({ lang }),
  setView: (view) => set({ view }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  toggleFuel: (fuel) =>
    set((s) => ({
      hiddenFuels: s.hiddenFuels.includes(fuel) ? s.hiddenFuels.filter((f) => f !== fuel) : [...s.hiddenFuels, fuel],
    })),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  step: (days, displayed) =>
    set((s) => {
      if (s.slot < SLOTS) return { slot: s.slot + 1 }
      const at = displayed ? days.indexOf(displayed) : -1
      const next = at >= 0 ? days[at + 1] : undefined
      return next ? { date: next, slot: 1 } : { playing: false }
    }),
}))

useApp.subscribe((s, previous) => {
  if (s.themeChoice !== previous.themeChoice) saveThemeChoice(s.themeChoice)
  if (s.lang !== previous.lang) saveLang(s.lang)
  if (s.layers !== previous.layers) saveLayerChoice(s.layers)
  if (s.hiddenFuels !== previous.hiddenFuels) saveHiddenFuels(s.hiddenFuels)
})

export const resetApp = () => useApp.setState(initial())
