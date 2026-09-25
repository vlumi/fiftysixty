export type Rgb = [number, number, number]
export type Rgba = [number, number, number, number]

/** The CSS tokens of index.css as numbers, for the WebGL layers; kept by hand, one set per theme. */
export interface Palette {
  bg: Rgb
  text: Rgb
  accent: Rgb
  hz: Record<50 | 60, Rgb>
}

export const DARK: Palette = {
  bg: [11, 13, 20],
  text: [214, 217, 224],
  accent: [0, 198, 230],
  hz: { 50: [0, 198, 230], 60: [238, 221, 102] },
}
