import type { Layer } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import type { Feature, Geometry } from 'geojson'
import type { AreaProps, Regions } from '../regions/geometry'
import type { Palette, Rgba } from '../shared/palette'
import { BELOW_LABELS } from './basemap'

/** Read by the interleaved overlay to slot a layer into the basemap's order, but not typed by deck. */
export interface Interleaved {
  beforeId?: string
}

/** The map's own layers for the loaded regions, in drawing order; pure, so a render is a rebuild. */
export function buildLayers(regions: Regions | null, palette: Palette): Layer[] {
  if (!regions) return []
  return [
    new GeoJsonLayer<AreaProps, Interleaved>({
      id: 'areas',
      beforeId: BELOW_LABELS,
      data: regions.areas,
      getFillColor: (f: Feature<Geometry, AreaProps>): Rgba => [...palette.hz[f.properties.hz], 45],
      getLineColor: [...palette.text, 110],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      pickable: true,
      updateTriggers: { getFillColor: palette },
    }),
    new GeoJsonLayer<unknown, Interleaved>({
      id: 'split',
      beforeId: BELOW_LABELS,
      data: regions.split,
      filled: false,
      getLineColor: [...palette.accent, 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 2,
    }),
  ]
}
