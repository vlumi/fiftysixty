import { create } from 'zustand'
import type { Area } from './regions/areas'
import { clampSlot } from './time/slots'
import { SLOTS } from './market/jepx'
import type { Series } from './market/stack'
import { loadThemeChoice, saveThemeChoice, type ThemeChoice } from './shared/theme'

/** What the reader has chosen: the delivery day (null for the opening day), the half hour, the area or a plant, and whether the day plays. */
interface State {
  date: string | null
  slot: number
  area: Area | null
  /** A picked plant, by its OpenStreetMap id; picking one lets the area go, and the other way round. */
  plant: string | null
  playing: boolean
  /** The fuels whose plants are hidden from the map. */
  hiddenFuels: Series[]
  themeChoice: ThemeChoice
}

interface Actions {
  setDate: (date: string | null) => void
  setSlot: (slot: number) => void
  selectArea: (area: Area | null) => void
  pickPlant: (plant: string | null) => void
  toggleFuel: (fuel: Series) => void
  setHiddenFuels: (fuels: Series[]) => void
  setThemeChoice: (choice: ThemeChoice) => void
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
  hiddenFuels: [],
  themeChoice: loadThemeChoice(),
})

export const useApp = create<State & Actions>((set) => ({
  ...initial(),
  setDate: (date) => set({ date }),
  setSlot: (slot) => set({ slot: clampSlot(slot) }),
  selectArea: (area) => set({ area, plant: null }),
  pickPlant: (plant) => set({ plant, area: null }),
  setHiddenFuels: (hiddenFuels) => set({ hiddenFuels }),
  setThemeChoice: (themeChoice) => set({ themeChoice }),
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
})

export const resetApp = () => useApp.setState(initial())
