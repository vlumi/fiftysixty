import type { Series } from '../market/stack'

export type Rgb = [number, number, number]
export type Rgba = [number, number, number, number]

/** The CSS tokens of index.css as numbers, for the WebGL layers; kept by hand, one set per theme. */
export interface Palette {
  bg: Rgb
  text: Rgb
  muted: Rgb
  accent: Rgb
  hz: Record<50 | 60, Rgb>
  /** One warm hue from near the surface to bright, low price to high; see shared/scale.ts. */
  price: readonly Rgb[]
  /** A line's color from idle to full, the cool hue against the warm areas. */
  flow: { idle: Rgb; full: Rgb }
  /** The chart's series, the `--src-*` tokens as numbers, for the plants. */
  series: Record<Series, Rgb>
}

export const DARK: Palette = {
  bg: [11, 13, 20],
  text: [214, 217, 224],
  muted: [138, 144, 160],
  accent: [0, 198, 230],
  hz: { 50: [0, 198, 230], 60: [238, 221, 102] },
  price: [
    [46, 24, 12],
    [150, 62, 18],
    [232, 118, 30],
    [255, 190, 70],
  ],
  flow: { idle: [120, 150, 170], full: [0, 230, 255] },
  series: {
    coal: [230, 103, 103],
    nuclear: [144, 133, 233],
    renewables: [0, 131, 0],
    otherThermal: [213, 81, 129],
    solar: [201, 133, 0],
    wind: [25, 158, 112],
    gas: [217, 89, 38],
    hydro: [57, 135, 229],
  },
}
