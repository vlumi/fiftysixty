import { SLOTS } from '../market/jepx'
import { clampSlot } from '../time/slots'

/** The frame the day charts share, in viewBox units: a gutter on the left for the axis labels, the 48 half hours across the rest. */
export const WIDTH = 320
export const TOP = 6
export const LEFT = 34
export const SPAN = WIDTH - LEFT

/** The middle of a half hour's column. */
export const slotX = (slot: number) => LEFT + ((slot - 0.5) / SLOTS) * SPAN

/** The half hour under a pointer at `clientX` over an element `rect` wide; the gutter counts as the first. */
export function slotAtX(clientX: number, rect: DOMRect): number {
  const px = ((clientX - rect.left) / rect.width) * WIDTH
  return clampSlot(((px - LEFT) / SPAN) * SLOTS + 0.5)
}
