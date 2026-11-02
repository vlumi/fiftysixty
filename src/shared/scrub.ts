import type { PointerEvent } from 'react'

/** Where each finger came down and whether it has set off sideways, by pointer id. */
const fingers = new Map<number, { x: number; y: number; sideways: boolean }>()

/**
 * A chart as a slider under the pointer: a press picks and a drag scrubs. On a touch screen the browser keeps the
 * vertical pan, the charts' styles allowing it, so the panel scrolls over them; since the browser delivers the first
 * move before it decides on the pan, a finger scrubs only once it has gone further sideways than down, and the press
 * picks when the finger lifts, so a scroll that starts on a chart does not move it.
 */
export function scrub<T extends Element>(pick: (e: PointerEvent<T>) => void) {
  return {
    onPointerDown: (e: PointerEvent<T>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      if (e.pointerType !== 'touch') return pick(e)
      fingers.set(e.pointerId, { x: e.clientX, y: e.clientY, sideways: false })
    },
    onPointerMove: (e: PointerEvent<T>) => {
      if (!e.buttons) return
      const finger = fingers.get(e.pointerId)
      if (!finger) return pick(e)
      finger.sideways ||= Math.abs(e.clientX - finger.x) > Math.abs(e.clientY - finger.y)
      if (finger.sideways) pick(e)
    },
    onPointerUp: (e: PointerEvent<T>) => {
      if (fingers.delete(e.pointerId)) pick(e)
    },
    onPointerCancel: (e: PointerEvent<T>) => {
      fingers.delete(e.pointerId)
    },
  }
}
