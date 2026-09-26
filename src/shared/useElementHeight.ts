import { useEffect, useState, type RefObject } from 'react'

/** The element's height as it changes, for whatever must keep clear of it; 0 without a ResizeObserver, as in tests. */
export function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height))
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return height
}
