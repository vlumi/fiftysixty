import { create } from 'zustand'
import type { Area, Hz } from './regions/areas'
import { clampSlot } from './time/slots'
import { SLOTS } from './market/jepx'
import type { Series } from './market/stack'
import { loadLang, saveLang, type Lang } from './i18n/strings'
import { formatLink, parseLink } from './shared/link'
import { loadThemeChoice, saveThemeChoice, type ThemeChoice } from './shared/theme'
import {
  loadHiddenFuels,
  loadLayerChoice,
  saveHiddenFuels,
  saveLayerChoice,
  type LayerChoice,
  type MapLayer,
} from './map/layerChoice'

/** The readout's figures for the displayed half hour, for its whole day, or the price history behind it. */
export type View = 'slot' | 'day' | 'history'

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
  view: View
  /** With nothing picked, the half of the grid the readout is scoped to, or all Japan. */
  half: Hz | null
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
  setView: (view: View) => void
  setHalf: (half: Hz | null) => void
  toggleFuel: (fuel: Series) => void
  setHiddenFuels: (fuels: Series[]) => void
  setThemeChoice: (choice: ThemeChoice) => void
  setLang: (lang: Lang) => void
  togglePlay: () => void
  /** Back to the opening view: the opening day at noon, nothing picked, all Japan, the half hour. */
  reset: () => void
  /** One half hour on from the displayed day; past the last, on to the next priced day, or a stop at the end of the data. */
  step: (days: readonly string[], displayed: string | null) => void
}

/** The opening view, which a link without choices and the name in the header open. */
const opening = () => ({
  date: null,
  slot: 25,
  area: null,
  plant: null,
  half: null,
  view: 'slot' as View,
  playing: false,
})

const initial = (): State => ({
  ...opening(),
  layers: loadLayerChoice(),
  hiddenFuels: loadHiddenFuels(),
  themeChoice: loadThemeChoice(),
  lang: loadLang(),
})

export const useApp = create<State & Actions>((set) => ({
  ...initial(),
  // The address's own choices open the page where a link pointed.
  ...parseLink(typeof location === 'undefined' ? '' : location.search),
  // A day or a half hour chosen by hand pauses the playback, which otherwise would run on from it.
  setDate: (date) => set({ date, playing: false }),
  setSlot: (slot) => set({ slot: clampSlot(slot), playing: false }),
  selectArea: (area) => set({ area, plant: null }),
  pickPlant: (plant) => set({ plant, area: null }),
  setHiddenFuels: (hiddenFuels) => set({ hiddenFuels }),
  setThemeChoice: (themeChoice) => set({ themeChoice }),
  setLang: (lang) => set({ lang }),
  setView: (view) => set({ view }),
  setHalf: (half) => set({ half }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  toggleFuel: (fuel) =>
    set((s) => ({
      hiddenFuels: s.hiddenFuels.includes(fuel) ? s.hiddenFuels.filter((f) => f !== fuel) : [...s.hiddenFuels, fuel],
    })),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  reset: () => set(opening()),
  step: (days, displayed) =>
    set((s) => {
      if (s.slot < SLOTS) return { slot: s.slot + 1 }
      const at = displayed ? days.indexOf(displayed) : -1
      const next = at >= 0 ? days[at + 1] : undefined
      return next ? { date: next, slot: 1 } : { playing: false }
    }),
}))

useApp.subscribe((s, previous) => {
  const link = formatLink(s)
  if (link !== formatLink(previous) && typeof history !== 'undefined')
    history.replaceState(null, '', link || location.pathname)
  if (s.themeChoice !== previous.themeChoice) saveThemeChoice(s.themeChoice)
  if (s.lang !== previous.lang) saveLang(s.lang)
  if (s.layers !== previous.layers) saveLayerChoice(s.layers)
  if (s.hiddenFuels !== previous.hiddenFuels) saveHiddenFuels(s.hiddenFuels)
})

export const resetApp = () => useApp.setState(initial())
