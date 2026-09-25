import { SLOTS } from '../market/jepx'

const MINUTES = 30

/** The half hour a slot covers, as JEPX counts them: slot 1 is 00:00 to 00:30 JST. */
export function slotRange(slot: number): string {
  return `${hhmm((slot - 1) * MINUTES)}–${hhmm(slot * MINUTES)}`
}

export function clampSlot(slot: number): number {
  return Math.min(SLOTS, Math.max(1, Math.round(slot)))
}

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
