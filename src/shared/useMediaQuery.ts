import { useEffect, useState } from 'react'

/** Whether the media query matches, following its changes; the fallback where matchMedia is unavailable, as in tests. */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? fallback)
  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}
