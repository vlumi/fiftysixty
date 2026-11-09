import { useStrings } from '../../i18n/useStrings'
import { co2Intensity, dayTotals, renewableShare, type DayTotals } from '../../market/daily'
import { turnover, type SpotSlot } from '../../market/jepx'
import type { RecordSlot } from '../../market/record'
import { kt, largeYen, percent, yen } from '../../shared/format'
import { useProvenance } from '../provenance'
import styles from './Readout.module.css'
import type { PricedScope } from './scope'

/** What this site computes from the half hour's record: its renewable share and its CO₂ per kWh generated. */
export function SlotDerived({ record }: { record: RecordSlot }) {
  const s = useStrings()
  const p = useProvenance()
  const half = dayTotals([record])
  return (
    <dl className={styles.rows}>
      <dt title={p.derived(s.readout.source.formula.renewable)}>{s.day.renewables}</dt>
      <dd>{percent(renewableShare(half))}</dd>
      <dt title={p.derived(s.readout.source.formula.co2Intensity)}>{s.day.co2Intensity}</dt>
      <dd>
        {Math.round(co2Intensity(half))} <span className="muted">g · {s.day.estimated}</span>
      </dd>
    </dl>
  )
}

/**
 * What this site computes for the day: the price weighted by demand where the record allows it, for the system what
 * the auction turned over, and from the record its renewable share and its CO₂, in all and per kWh generated.
 */
export function DayDerived({
  scope,
  spot,
  totals,
  weighted,
}: {
  scope: PricedScope
  spot: readonly SpotSlot[] | undefined
  totals: DayTotals | null
  /** The price weighted by demand, ¥/kWh, or null without the record. */
  weighted: number | null
}) {
  const s = useStrings()
  const p = useProvenance()
  const f = s.readout.source.formula
  const turned = scope.kind === 'system' && spot
  if (weighted === null && !turned && !totals) return null
  return (
    <section aria-label={s.readout.source.derived}>
      <dl className={styles.rows}>
        {weighted !== null && (
          <>
            <dt title={p.derived(f.weighted)}>{s.day.price}</dt>
            <dd>
              {yen(weighted)} <span className="muted">{s.readout.yenPerKwh}</span>
            </dd>
          </>
        )}
        {turned && (
          <>
            <dt title={p.derived(f.turnover)}>{s.day.turnover}</dt>
            <dd>
              {largeYen(turnover(spot), s.readout.largeYen)} <span className="muted">{s.readout.largeYen.unit}</span>
            </dd>
          </>
        )}
        {totals && (
          <>
            <dt title={p.derived(f.renewable)}>{s.day.renewables}</dt>
            <dd>{percent(renewableShare(totals))}</dd>
            <dt title={p.derived(f.co2)}>{s.day.co2}</dt>
            <dd>
              {kt(totals.co2t)} <span className="muted">{s.day.kt}</span>
            </dd>
            <dt title={p.derived(f.co2Intensity)}>{s.day.co2Intensity}</dt>
            <dd>
              {Math.round(co2Intensity(totals))} <span className="muted">g</span>
            </dd>
          </>
        )}
      </dl>
    </section>
  )
}
