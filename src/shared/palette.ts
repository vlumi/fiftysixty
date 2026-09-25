import type { Series } from '../market/stack'
import type { Theme } from './theme'

export type Rgb = [number, number, number]
export type Rgba = [number, number, number, number]

/** The CSS tokens of index.css as numbers, for the WebGL layers; kept by hand, one set per theme, see PALETTES. */
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

export const LIGHT: Palette = {
  bg: [244, 245, 248],
  text: [28, 31, 38],
  muted: [91, 98, 112],
  accent: [0, 122, 144],
  hz: { 50: [0, 122, 144], 60: [143, 95, 0] },
  price: [
    [252, 234, 218],
    [242, 168, 100],
    [200, 84, 22],
    [110, 36, 6],
  ],
  flow: { idle: [110, 122, 140], full: [0, 122, 144] },
  series: {
    coal: [227, 73, 72],
    nuclear: [74, 58, 167],
    renewables: [0, 131, 0],
    otherThermal: [232, 123, 164],
    solar: [237, 161, 0],
    wind: [27, 175, 122],
    gas: [235, 104, 52],
    hydro: [42, 120, 214],
  },
}

export const PALETTES: Record<Theme, Palette> = { dark: DARK, light: LIGHT }
