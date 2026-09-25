import { useEffect } from 'react'

/** Four half hours a second while playing: a day in twelve seconds. */
export const STEP_MS = 250

/** Runs the clock while it plays, one step per tick. */
export function usePlayer(playing: boolean, step: () => void) {
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(step, STEP_MS)
    return () => clearInterval(timer)
  }, [playing, step])
}
