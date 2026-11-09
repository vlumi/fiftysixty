import type { Publisher } from '../../market/sources'
import { AREA_BY_ID, areasOf, type Area, type Hz, type PricedArea } from '../../regions/areas'
import type { PlantProps } from '../../regions/plants'
import type { Provenance } from '../provenance'

/** What the readout is about: a picked plant, Okinawa, which has no price, a picked area, a half of the grid, or the system. */
export type Scope =
  | { kind: 'plant'; plant: PlantProps }
  | { kind: 'okinawa' }
  | { kind: 'area'; area: PricedArea }
  | { kind: 'half'; half: Hz }
  | { kind: 'system' }

/** A scope with prices and a record: an area, a half or the system. */
export type PricedScope = Extract<Scope, { kind: 'area' | 'half' | 'system' }>

/** A scope summed from its areas' records: a half or the system. */
export type SummedScope = Extract<Scope, { kind: 'half' | 'system' }>

/** The scope from the reader's choices: a plant over an area, Okinawa apart, and a half only with nothing picked. */
export function scopeOf(area: Area | null, plant: PlantProps | null, half: Hz | null): Scope {
  if (plant) return { kind: 'plant', plant }
  if (area === 'okinawa') return { kind: 'okinawa' }
  if (area) return { kind: 'area', area }
  if (half) return { kind: 'half', half }
  return { kind: 'system' }
}

/** Whether the area lies inside the scope, which is what a line across its border crosses. */
export function inScope(scope: Scope, area: Area): boolean {
  switch (scope.kind) {
    case 'area':
      return scope.area === area
    case 'half':
      return AREA_BY_ID[area].hz === scope.half
    case 'system':
      return area !== 'okinawa'
    default:
      return false
  }
}

/** The half the scope lies in, an area's own or the half itself, or none for the system. */
export function scopeHz(scope: Scope): Hz | null {
  return scope.kind === 'area' ? AREA_BY_ID[scope.area].hz : scope.kind === 'half' ? scope.half : null
}

/** What the panel was opened for, so another pick opens it folded again; a half is a scope, not a pick, and leaves it open. */
export function pickKey(scope: Scope): string {
  return scope.kind === 'plant' ? `plant/${scope.plant.id}` : scope.kind === 'area' ? scope.area : 'system'
}

/** The priced areas the scope covers. */
export function scopeAreas(scope: Scope): readonly PricedArea[] {
  return scope.kind === 'area'
    ? [scope.area]
    : scope.kind === 'half' || scope.kind === 'system'
      ? areasOf(scopeHz(scope))
      : []
}

/** Who a group of the readout's rows is from: JEPX, a picked area's company or the companies together, OCCTO, or this site. */
export type SourceGroup = { kind: Publisher | 'derived'; area?: PricedArea }

/** The record a scope's figures come from: the picked area's company's, or the companies' summed for a half or all Japan. */
export const recordGroup = (scope: PricedScope): SourceGroup =>
  scope.kind === 'area' ? { kind: 'record', area: scope.area } : { kind: 'record' }

/** A tooltip for a figure from the scope's record: the one company's file, or the areas' files summed. */
export const recordProvenance = (p: Provenance, scope: PricedScope) => (field: string, note?: string) =>
  scope.kind === 'area' ? p.record(scope.area, field, note) : p.records(scopeAreas(scope), field, note)
