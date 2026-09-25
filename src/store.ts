import { create } from 'zustand'
import type { Area } from './regions/areas'
import { clampSlot } from './time/slots'

/** What the reader has chosen: the delivery day (null for the newest), the half hour, and the area. */
interface State {
  date: string | null
  slot: number
  area: Area | null
}

interface Actions {
  setDate: (date: string | null) => void
  setSlot: (slot: number) => void
  selectArea: (area: Area | null) => void
}

const initial: State = { date: null, slot: 25, area: null }

export const useApp = create<State & Actions>((set) => ({
  ...initial,
  setDate: (date) => set({ date }),
  setSlot: (slot) => set({ slot: clampSlot(slot) }),
  selectArea: (area) => set({ area }),
}))

export const resetApp = () => useApp.setState(initial)
