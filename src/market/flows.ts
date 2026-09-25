import { OCCTO_LINES } from '../regions/interconnectors'

/** One half hour of a line as OCCTO forecast it the day before: limits both ways, the flow, and whether the market split there. */
export interface FlowSlot {
  slot: number
  /** The operating capacity in the forward and the reverse direction, MW. */
  capacityMW: { forward: number; reverse: number }
  /** The forecast flow, MW, positive in the line's forward direction. */
  flowMW: number
  freeMW: { forward: number; reverse: number }
  /** Whether the day-ahead market split across the line, in either direction. */
  split: boolean
}

/** By day, then by line id, the 48 slots in order. */
export type FlowDays = Map<string, Map<string, FlowSlot[]>>

const LINE_BY_NAME = new Map(OCCTO_LINES.map((l) => [l.name, l.id]))

export async function loadFlows(month: string, base = '/data'): Promise<FlowDays | null> {
  const url = `${base}/occto-renkei-${month}.csv`
  const response = await fetch(url)
  if (response.status === 404 || response.headers.get('content-type')?.includes('text/html')) return null
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return parseFlows(await response.text())
}

/**
 * Parses OCCTO's 広域予備率連系線情報 CSV: an update line, then a quoted header, then one row per line and half hour,
 * the time naming the end of the half hour. Circuits sharing an id are summed, a split on either counting.
 */
export function parseFlows(csv: string): FlowDays {
  const rows = csv
    .replace(/^﻿/, '')
    .trim()
    .split(/\r?\n/)
    .map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')))
  const headerAt = rows.findIndex((r) => r[0] === '対象年月日')
  if (headerAt < 0) throw new Error(`OCCTO header missing from: ${rows[0]?.join(',')}`)
  const columns = rows[headerAt]
  const column = (name: string) => {
    const index = columns.indexOf(name)
    if (index < 0) throw new Error(`OCCTO column ${name} missing from: ${columns.join(',')}`)
    return index
  }
  const date = column('対象年月日')
  const time = column('時刻')
  const line = column('連系線名')
  const capF = column('順方向運用容量(MW)')
  const capR = column('逆方向運用容量(MW)')
  const flow = column('順方向予想潮流(MW)')
  const freeF = column('順方向空容量(MW)')
  const freeR = column('逆方向空容量(MW)')
  const splitF = column('順方向分断情報')
  const splitR = column('逆方向分断情報')

  const days: FlowDays = new Map()
  for (const cells of rows.slice(headerAt + 1)) {
    if (cells.length < columns.length) continue
    const id = LINE_BY_NAME.get(cells[line])
    if (!id) continue
    const day = cells[date].replaceAll('/', '-')
    const [h, m] = cells[time].split(':').map(Number)
    const slot = h * 2 + m / 30
    const lines = days.get(day) ?? new Map<string, FlowSlot[]>()
    days.set(day, lines)
    const slots = lines.get(id) ?? []
    lines.set(id, slots)
    const at = slots.find((s) => s.slot === slot)
    const next: FlowSlot = {
      slot,
      capacityMW: { forward: Number(cells[capF]) || 0, reverse: Number(cells[capR]) || 0 },
      flowMW: Number(cells[flow]) || 0,
      freeMW: { forward: Number(cells[freeF]) || 0, reverse: Number(cells[freeR]) || 0 },
      split: cells[splitF] === '分断あり' || cells[splitR] === '分断あり',
    }
    if (!at) slots.push(next)
    else {
      at.capacityMW.forward += next.capacityMW.forward
      at.capacityMW.reverse += next.capacityMW.reverse
      at.flowMW += next.flowMW
      at.freeMW.forward += next.freeMW.forward
      at.freeMW.reverse += next.freeMW.reverse
      at.split ||= next.split
    }
  }
  for (const lines of days.values()) for (const slots of lines.values()) slots.sort((a, b) => a.slot - b.slot)
  return days
}

/** Every line's forecast for one half hour, by line id. */
export function flowsAt(days: FlowDays | null | undefined, date: string | null, slot: number): Map<string, FlowSlot> {
  const at = new Map<string, FlowSlot>()
  if (!days || !date) return at
  for (const [id, slots] of days.get(date) ?? []) {
    const s = slots.find((x) => x.slot === slot)
    if (s) at.set(id, s)
  }
  return at
}

/** How full the line is in the direction of its flow, 0 to 1; 0 when it has no capacity that way. */
export function load(s: FlowSlot): number {
  const capacity = s.flowMW >= 0 ? s.capacityMW.forward : s.capacityMW.reverse
  return capacity > 0 ? Math.min(1, Math.abs(s.flowMW) / capacity) : 0
}
