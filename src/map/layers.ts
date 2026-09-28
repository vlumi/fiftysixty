import type { Layer } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import type { Feature, Geometry } from 'geojson'
import type { FlowSlot } from '../market/flows'
import type { PricedArea } from '../market/jepx'
import type { Area } from '../regions/areas'
import type { AreaProps, BorderProps, Regions } from '../regions/geometry'
import type { Plants } from '../regions/plants'
import type { Series } from '../market/stack'
import type { Palette, Rgba } from '../shared/palette'
import { priceColor } from '../shared/scale'
import { buildFlowLayers } from './flowLayers'
import { mapScale } from './scale'
import { buildPlantLayers } from './plantLayers'

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
  /** The map's zoom, which sizes the arrows' shafts and the plants' dots. */
  zoom?: number
  plants?: Plants | null
  selectedPlant?: string | null
  hiddenFuels?: readonly Series[]
  /** The basemap layer to interleave beneath, the style's first label layer. */
  beforeId?: string
}

/**
 * The map's own layers for the loaded regions, in drawing order; pure, so a render is a rebuild. With prices the
 * areas are colored by them, Okinawa muted; without, by their frequency. The selected area gets a strong outline.
 */
export function buildLayers(
  regions: Regions | null,
  palette: Palette,
  {
    prices,
    selected,
    flows,
    zoom = 5,
    plants = null,
    selectedPlant = null,
    hiddenFuels = [],
    beforeId = 'water_name',
  }: LayerOptions = {},
): Layer[] {
  if (!regions) return []
  const fill = (f: Feature<Geometry, AreaProps>): Rgba => {
    if (!prices) return [...palette.hz[f.properties.hz], 45]
    const price = f.properties.area === 'okinawa' ? undefined : prices[f.properties.area]
    return price === undefined || !Number.isFinite(price)
      ? [...palette.muted, 40]
      : [...priceColor(price, palette.price[f.properties.hz]), 170]
  }
  return [
    new GeoJsonLayer<AreaProps, Interleaved>({
      id: 'areas',
      beforeId,
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
      beforeId,
      data: regions.split,
      filled: false,
      getLineColor: [...palette.accent, 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 2,
    }),
    ...buildWallLayers(regions, palette, prices, zoom, beforeId),
    ...buildFlowLayers(flows ?? new Map(), palette, zoom, beforeId),
    ...buildPlantLayers(plants, palette, zoom, selectedPlant, hiddenFuels, beforeId),
  ]
}

/**
 * The market's walls: the border along each interconnector whose two areas cleared at different prices, which is
 * what a market split is, so the areas walled in together are the markets the auction settled that half hour.
 */
export function buildWallLayers(
  regions: Regions,
  palette: Palette,
  prices: AreaPrices | undefined,
  zoom: number,
  beforeId = 'water_name',
): Layer[] {
  if (!prices) return []
  const priced = (area: Area) => (area === 'okinawa' ? undefined : prices[area])
  const walls = regions.borders.features.filter((f) => {
    const [a, b] = [priced(f.properties.a), priced(f.properties.b)]
    return a !== undefined && b !== undefined && Number.isFinite(a) && Number.isFinite(b) && a !== b
  })
  if (!walls.length) return []
  return [
    new GeoJsonLayer<BorderProps, Interleaved>({
      id: 'walls',
      beforeId,
      data: { type: 'FeatureCollection', features: walls },
      filled: false,
      getLineColor: [...palette.text, 240],
      lineWidthUnits: 'pixels',
      getLineWidth: Math.max(2, 4 * mapScale(zoom)),
      lineCapRounded: true,
      lineJointRounded: true,
      updateTriggers: { getLineColor: palette },
    }),
  ]
}
