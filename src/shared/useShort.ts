import { useMediaQuery } from './useMediaQuery'

/** Screens too short to pin the readout's switches beside its headline without crowding out the content: the small phones. */
export const SHORT_QUERY = '(max-height: 700px)'

/** True on a short viewport, see SHORT_QUERY; false where matchMedia is unavailable, as in tests. */
export const useShort = () => useMediaQuery(SHORT_QUERY, false)
