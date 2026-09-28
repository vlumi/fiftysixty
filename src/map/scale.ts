/** The zoom the overlays are drawn full size at: a desktop window showing all of Japan. */
export const FULL_SIZE_ZOOM = 5

/**
 * How much the columns, the arrows and the plants scale with the map: halving with each level out, so a phone's
 * map is not swamped, and growing in only up to `max`, so zooming close does not blow them up.
 */
export function mapScale(zoom: number, max = 1.5): number {
  return Math.min(max, Math.max(0.3, 2 ** (zoom - FULL_SIZE_ZOOM)))
}
