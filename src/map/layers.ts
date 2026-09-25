import type { Layer } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import type { Feature, Geometry } from 'geojson'
import type { FlowSlot } from '../market/flows'
import type { PricedArea } from '../market/jepx'
import type { Area } from '../regions/areas'
import type { AreaProps, Regions } from '../regions/geometry'
import type { Palette, Rgba } from '../shared/palette'
import { priceColor } from '../shared/scale'
import { BELOW_LABELS } from './basemap'
import { buildFlowLayers } from './flowLayers'

/** Read by the interleaved overlay to slot a layer into the basemap's order, but not typed by deck. */
export interface Interleaved {
  beforeId?: string
}

export type AreaPrices = Readonly<Record<PricedArea, number>>

export interface LayerOptions {
  prices?: AreaPrices
  selected?: Area | null
  /** The interconnectors' forecast for the slot, by line id; drawn as arrows between the areas. */
  flows?: ReadonlyMap<string, FlowSlot>
}

/**
 * The map's own layers for the loaded regions, in drawing order; pure, so a render is a rebuild. With prices the
 * areas are colored by them, Okinawa muted; without, by their frequency. The selected area gets a strong outline.
 */
export function buildLayers(
  regions: Regions | null,
  palette: Palette,
  { prices, selected, flows }: LayerOptions = {},
): Layer[] {
  if (!regions) return []
  const fill = (f: Feature<Geometry, AreaProps>): Rgba => {
    if (!prices) return [...palette.hz[f.properties.hz], 45]
    const price = f.properties.area === 'okinawa' ? undefined : prices[f.properties.area]
    return price === undefined ? [...palette.muted, 40] : [...priceColor(price, palette.price), 170]
  }
  return [
    new GeoJsonLayer<AreaProps, Interleaved>({
      id: 'areas',
      beforeId: BELOW_LABELS,
      data: regions.areas,
      getFillColor: fill,
      getLineColor: (f: Feature<Geometry, AreaProps>): Rgba => [
        ...palette.text,
        f.properties.area === selected ? 255 : 110,
      ],
      lineWidthUnits: 'pixels',
      getLineWidth: (f: Feature<Geometry, AreaProps>) => (f.properties.area === selected ? 2.5 : 1),
      pickable: true,
      updateTriggers: { getFillColor: [palette, prices], getLineColor: [palette, selected], getLineWidth: selected },
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
    ...buildFlowLayers(flows ?? new Map(), palette),
  ]
}
