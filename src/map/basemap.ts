import type { LngLatBoundsLike } from 'maplibre-gl'

/** OpenFreeMap's vector tiles, free and keyless; the same style nebulosa uses in the dark. */
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord'

/** The four main islands and their waters, with room for the interconnector arrows on the sea. */
export const JAPAN_BOUNDS: LngLatBoundsLike = [
  [127, 30],
  [147, 46],
]

/** The style's first label layer; the market layers are interleaved beneath it so the place names stay legible. */
export const BELOW_LABELS = 'water_name'
