import { useEffect, useState, type RefObject } from 'react'

/** The element's size as it changes, for what must fit or keep clear of it; zeros without a ResizeObserver, as in tests. */
export function useElementSize(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect()
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}
