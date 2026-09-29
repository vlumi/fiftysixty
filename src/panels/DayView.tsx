import { useStrings } from '../i18n/useStrings'
import { co2Intensity, floorSlots, renewableShare, type DayTotals } from '../market/daily'
import { SLOTS, type PricedArea, type SpotSlot } from '../market/jepx'
import { SERIES } from '../market/stack'
import { mw, yen } from '../shared/format'
import { slotRange } from '../time/slots'
import styles from './DayView.module.css'

const GWH = 1000
const gwh = (mwh: number) => (mwh / GWH).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
/** When a half hour begins, as the time bar gives it. */
const startOf = (slot: number) => slotRange(slot).split('–')[0]
const percent = (share: number) => `${Math.round(share * 100)}%`

interface Props {
  /** The day's totals, or null when the records for it are not all in. */
  totals: DayTotals | null
  /** The price weighted by demand, ¥/kWh. */
  price: number | null
  spot: readonly SpotSlot[] | undefined
  /** The area, or none for all Japan. */
  area: PricedArea | null
}

/**
 * The displayed day in energy: how it was supplied, as one bar and a table of each source's GWh and share, read from
 * the top as the chart stacks, then the day's figures.
 */
export default function DayView({ totals, price, spot, area }: Props) {
  const s = useStrings()
  if (!totals) return <p className="muted">{area ? s.readout.noRecord : s.day.notAll}</p>
  const supply = [
    { key: 'imports', name: s.chart.imports, color: 'var(--src-exchange)', mwh: area ? totals.importMWh : 0 },
    { key: 'storageOut', name: s.chart.storageOut, color: 'var(--src-storage)', mwh: totals.storageOutMWh },
    ...[...SERIES].reverse().map((x) => ({
      key: x,
      name: s.chart.series[x],
      color: `var(--src-${x})`,
      mwh: totals.bySeries[x],
    })),
  ].filter((r) => r.mwh > 0)
  const total = supply.reduce((sum, r) => sum + r.mwh, 0)
  const floors = floorSlots(spot, area ?? undefined)
  return (
    <section className={styles.day} aria-label={s.day.supply}>
      {totals.slots < SLOTS && <p className="muted">{s.day.soFar(slotRange(totals.slots).split('–')[1])}</p>}
      <div className={styles.bar} role="img" aria-label={s.day.supply}>
        {supply.map((r) => (
          <span key={r.key} style={{ flexGrow: r.mwh, background: r.color }} title={r.name} />
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <td />
            <th scope="col">{s.day.gwh}</th>
            <th scope="col">{s.day.share}</th>
          </tr>
        </thead>
        <tbody>
          {supply.map((r) => (
            <tr key={r.key}>
              <th scope="row">
                <span className={styles.swatch} style={{ background: r.color }} />
                {r.name}
              </th>
              <td>{gwh(r.mwh)}</td>
              <td>{percent(r.mwh / total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className={styles.figures}>
        <dt>{s.day.demand}</dt>
        <dd>
          {gwh(totals.demandMWh)} <span className="muted">{s.day.gwh}</span>
        </dd>
        <dt>{s.day.peak}</dt>
        <dd>
          {mw(totals.peak.mw)} <span className="muted">MW · {startOf(totals.peak.slot)}</span>
        </dd>
        <dt>{s.day.low}</dt>
        <dd>
          {mw(totals.low.mw)} <span className="muted">MW · {startOf(totals.low.slot)}</span>
        </dd>
        <dt>{s.day.renewables}</dt>
        <dd>{percent(renewableShare(totals))}</dd>
        <dt>{s.day.co2}</dt>
        <dd>
          {(totals.co2t / 1000).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}{' '}
          <span className="muted">{s.day.kt}</span>
        </dd>
        <dt>{s.day.co2Intensity}</dt>
        <dd>
          {Math.round(co2Intensity(totals))} <span className="muted">g</span>
        </dd>
        {totals.curtailedMWh > 0 && (
          <>
            <dt>{s.day.curtailed}</dt>
            <dd>
              {gwh(totals.curtailedMWh)} <span className="muted">{s.day.gwh}</span>
            </dd>
          </>
        )}
        {area && totals.exportMWh > 0 && (
          <>
            <dt>{s.day.exported}</dt>
            <dd>
              {gwh(totals.exportMWh)} <span className="muted">{s.day.gwh}</span>
            </dd>
          </>
        )}
        {totals.storageInMWh > 0 && (
          <>
            <dt>{s.day.storedIn}</dt>
            <dd>
              {gwh(totals.storageInMWh)} <span className="muted">{s.day.gwh}</span>
            </dd>
          </>
        )}
        {price !== null && (
          <>
            <dt>{s.day.price}</dt>
            <dd>
              {yen(price)} <span className="muted">{s.readout.yenPerKwh}</span>
            </dd>
          </>
        )}
        {floors > 0 && (
          <>
            <dt>{s.day.floor}</dt>
            <dd>{floors}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
