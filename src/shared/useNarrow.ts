import { useMediaQuery } from './useMediaQuery'

/** Phones, and desktop windows too short for the panels. Keep in step with the media queries in the CSS modules. */
export const NARROW_QUERY = '(max-width: 720px), (max-height: 560px)'

/** True on small viewports, see NARROW_QUERY; false where matchMedia is unavailable, as in tests. */
export const useNarrow = () => useMediaQuery(NARROW_QUERY, false)
