import type { Layer } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import type { Feature, Point } from 'geojson'
import type { Series } from '../market/stack'
import type { PlantProps, Plants } from '../regions/plants'
import type { Palette, Rgba } from '../shared/palette'
import type { Interleaved } from './layers'

type PlantFeature = Feature<Point, PlantProps>

/** The zoom at which the dots are full size; further out they shrink with the map, to a pixel and a half at least. */
const FULL_SIZE_ZOOM = 6

/** A dot's radius on screen: a few pixels plus the square root of the capacity, so area follows capacity, shrunk when far out. */
export const plantRadius = (mw: number, zoom = FULL_SIZE_ZOOM) =>
  Math.max(1.5, (3 + Math.sqrt(mw) / 4) * Math.min(1, 2 ** (zoom - FULL_SIZE_ZOOM)))

/** The plants as dots colored by fuel and sized by capacity, smaller the further out the map is. */
export function buildPlantLayers(
  plants: Plants | null,
  palette: Palette,
  zoom: number,
  selected: string | null,
  hiddenFuels: readonly Series[] = [],
  beforeId = 'water_name',
): Layer[] {
  if (!plants) return []
  return [
    new ScatterplotLayer<PlantFeature, Interleaved>({
      id: 'plants',
      beforeId,
      data: plants.features.filter((f) => !hiddenFuels.includes(f.properties.fuel)),
      getPosition: (f) => f.geometry.coordinates as [number, number],
      getRadius: (f) => plantRadius(f.properties.mw, zoom),
      radiusUnits: 'pixels',
      getFillColor: (f): Rgba => [...palette.series[f.properties.fuel], 220],
      stroked: true,
      getLineColor: (f): Rgba => (f.properties.id === selected ? [...palette.text, 255] : [...palette.bg, 200]),
      getLineWidth: (f) => (f.properties.id === selected ? 2 : 1),
      lineWidthUnits: 'pixels',
      pickable: true,
      updateTriggers: {
        getRadius: zoom,
        getFillColor: palette,
        getLineColor: [palette, selected],
        getLineWidth: selected,
      },
    }),
  ]
}
