import { Fragment } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { Interchange } from '../../market/interchange'
import { PRICED_AREA_IDS, type Area } from '../../regions/areas'
import { OCCTO_LINES_ONCE } from '../../regions/interconnectors'
import { areaName, lineName } from '../../regions/names'
import { mw } from '../../shared/format'
import { useApp } from '../../store'
import { OCCTO_FIELDS, RECORD_FIELDS, useProvenance } from '../provenance'
import styles from './Readout.module.css'
import SourceHeading from './SourceHeading'
import { inScope, type Scope } from './scope'

/**
 * The lines across the picked area's borders, or across the half's, which are the frequency converters alone, since
 * nothing else crosses the middle: each in or out against its limit, and for an area its loop as the total. Under
 * OCCTO's header when the half hour has its plan alone; the records that settle the flows are the group above.
 */
export default function Lines({
  scope,
  interchange,
}: {
  scope: Extract<Scope, { kind: 'area' | 'half' }>
  interchange: Interchange | null
}) {
  const s = useStrings()
  const p = useProvenance()
  const lang = useApp((x) => x.lang)
  if (!interchange) return null
  const planned = interchange.source === 'planned'
  const flow = planned
    ? p.occto(OCCTO_FIELDS.flow)
    : p.records(PRICED_AREA_IDS, RECORD_FIELDS.lines, s.readout.source.settled)
  const capacity = `${s.readout.source.capacityFrom} ${p.occto(OCCTO_FIELDS.capacity)}`
  const mine = (x: Area) => inScope(scope, x)
  const lines = interchange.links
    .filter((l) => mine(l.from) !== mine(l.to))
    .map((l) => {
      const line = OCCTO_LINES_ONCE.find((x) => x.id === l.id)!
      return {
        id: l.id,
        label: lineName(line, lang),
        inward: mine(l.to),
        mw: l.mw,
        capacity: l.capacityMW,
        split: l.split,
        title: l.capacityMW === undefined ? flow : `${flow}\n${capacity}`,
      }
    })
  // A loop gives the area's total across its two lines of it, not how that divides between them.
  const area = scope.kind === 'area' ? scope.area : null
  const loops = interchange.forks.flatMap((f) => {
    const total = area && f.totals[area]
    if (total === undefined || total === null) return []
    const [a, b] = (Object.keys(f.totals) as Area[]).filter((x) => x !== area)
    return [
      {
        id: f.id,
        label: s.readout.loopWith(areaName(a, lang), areaName(b, lang)),
        inward: total >= 0,
        mw: Math.abs(total),
        capacity: undefined,
        split: false,
        title: flow,
      },
    ]
  })
  const rows = [...lines, ...loops]
  if (!rows.length) return null
  return (
    <>
      {planned && <SourceHeading source={{ kind: 'occto' }} />}
      <section aria-label={s.readout.lines}>
        <h4>{s.readout.lines}</h4>
        <dl className={styles.rows}>
          {rows.map((r) => (
            <Fragment key={r.id}>
              <dt title={r.title}>
                {r.label}{' '}
                {r.split && (
                  <span className={styles.split} title={p.occto(OCCTO_FIELDS.split)}>
                    {s.readout.split}
                  </span>
                )}
              </dt>
              <dd>
                <span className="muted">{r.inward ? s.readout.in : s.readout.out}</span> {mw(r.mw)}
                {r.capacity !== undefined && (
                  <span className="muted">
                    {' '}
                    {s.readout.of} {mw(r.capacity)}
                  </span>
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      </section>
    </>
  )
}
