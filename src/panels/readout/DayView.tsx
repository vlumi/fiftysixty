import { useStrings } from '../../i18n/useStrings'
import {
  co2Intensity,
  floorSlots,
  priceStats,
  renewableShare,
  spreadStats,
  type DayTotals,
  type JapanDay,
} from '../../market/daily'
import { SLOTS, turnover, type SpotSlot } from '../../market/jepx'
import type { MonthDay, MonthPrice } from '../../market/monthly'
import { SERIES_TOP_DOWN } from '../../market/stack'
import { areasOf, type Hz, type PricedArea } from '../../regions/areas'
import { areaName } from '../../regions/names'
import { gwh, kt, largeYen, mw, percent, yen } from '../../shared/format'
import { useApp } from '../../store'
import { slotEnd, slotStart } from '../../time/slots'
import MonthStrip from '../MonthStrip'
import styles from './DayView.module.css'
import ScopeHeading from './ScopeHeading'
import { scopeHz, type PricedScope } from './scope'

interface Props {
  scope: PricedScope
  spotDay: readonly SpotSlot[] | undefined
  /** The day's totals and its price weighted by demand, null without the record. */
  totals: DayTotals | null
  price: number | null
  /** The scope's half hours of the day summed, for the areas left out of a half's or all Japan's. */
  scoped: JapanDay
  monthDays: readonly MonthDay[]
  monthPrices: readonly MonthPrice[]
  date: string | null
  onDate: (date: string) => void
}

/** The whole day: its prices, its supply under the scope's name, and the month's days under it to scrub through. */
export default function DayView({
  scope,
  spotDay,
  totals,
  price,
  scoped,
  monthDays,
  monthPrices,
  date,
  onDate,
}: Props) {
  return (
    <>
      <DayPrices spot={spotDay} scope={scope} weighted={price} />
      {scope.kind !== 'area' && <ScopeHeading scope={scope} missing={scoped.missing} />}
      <DaySupply totals={totals} scope={scope} />
      <MonthStrip
        days={monthDays}
        prices={monthPrices}
        hz={scopeHz(scope)}
        weighted={scope.kind === 'half'}
        date={date}
        onPick={onDate}
      />
    </>
  )
}

/**
 * The displayed day in energy: how it was supplied, as one bar and a table of each source's GWh and share, read from
 * the top as the chart stacks, then the day's figures; or, while the records for it are not all in, a note. The prices
 * stand above it, as the price curve stands above the supply chart.
 */
export function DaySupply({ totals, scope }: { totals: DayTotals | null; scope: PricedScope }) {
  const s = useStrings()
  const area = scope.kind === 'area'
  if (!totals) return <p className="muted">{area ? s.readout.noRecord : s.day.notAll}</p>
  const supply = [
    { key: 'imports', name: s.chart.imports, color: 'var(--src-exchange)', mwh: area ? totals.importMWh : 0 },
    { key: 'storageOut', name: s.chart.storageOut, color: 'var(--src-storage)', mwh: totals.storageOutMWh },
    ...SERIES_TOP_DOWN.map((x) => ({
      key: x,
      name: s.chart.series[x],
      color: `var(--src-${x})`,
      mwh: totals.bySeries[x],
    })),
  ].filter((r) => r.mwh > 0)
  const total = supply.reduce((sum, r) => sum + r.mwh, 0)
  return (
    <section className={styles.day} aria-label={s.day.supply}>
      {totals.slots < SLOTS && <p className="muted">{s.day.soFar(slotEnd(totals.slots))}</p>}
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
          {mw(totals.peak.mw)} <span className="muted">MW · {slotStart(totals.peak.slot)}</span>
        </dd>
        <dt>{s.day.low}</dt>
        <dd>
          {mw(totals.low.mw)} <span className="muted">MW · {slotStart(totals.low.slot)}</span>
        </dd>
        <dt>{s.day.renewables}</dt>
        <dd>{percent(renewableShare(totals))}</dd>
        <dt>{s.day.co2}</dt>
        <dd>
          {kt(totals.co2t)} <span className="muted">{s.day.kt}</span>
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
      </dl>
    </section>
  )
}

/**
 * The displayed day in price: the mean, the price weighted by demand where the record allows it, the low and the high
 * with when, the half hours at the floor, and for the system what the auction turned over; they stand for any priced day, since the auction runs a day ahead of
 * the record. For a half of the grid, which has no price of its own, the figures JEPX's prices give: the lowest and
 * the highest across its areas with where and when, the area half hours at the floor, and the weighted price.
 */
export function DayPrices({
  spot,
  scope,
  weighted,
}: {
  spot: readonly SpotSlot[] | undefined
  scope: PricedScope
  /** The price weighted by demand, ¥/kWh, or null without the record. */
  weighted: number | null
}) {
  const s = useStrings()
  if (scope.kind === 'half') return <HalfPrices spot={spot} half={scope.half} weighted={weighted} />
  const area = scope.kind === 'area' ? scope.area : undefined
  const stats = priceStats(spot, area)
  if (!stats) return null
  const floors = floorSlots(spot, area)
  return (
    <section aria-label={s.day.prices}>
      <dl className={styles.figures}>
        <dt>{s.day.meanPrice}</dt>
        <dd>
          {yen(stats.mean)} <span className="muted">{s.readout.yenPerKwh}</span>
        </dd>
        {weighted !== null && (
          <>
            <dt>{s.day.price}</dt>
            <dd>
              {yen(weighted)} <span className="muted">{s.readout.yenPerKwh}</span>
            </dd>
          </>
        )}
        <dt>{s.day.lowPrice}</dt>
        <dd>
          {yen(stats.low.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {slotStart(stats.low.slot)}
          </span>
        </dd>
        <dt>{s.day.highPrice}</dt>
        <dd>
          {yen(stats.high.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {slotStart(stats.high.slot)}
          </span>
        </dd>
        {floors > 0 && (
          <>
            <dt>{s.day.floor}</dt>
            <dd>{floors}</dd>
          </>
        )}
        {!area && spot && (
          <>
            <dt>{s.day.turnover}</dt>
            <dd>
              {largeYen(turnover(spot), s.readout.largeYen)} <span className="muted">{s.readout.largeYen.unit}</span>
            </dd>
          </>
        )}
      </dl>
    </section>
  )
}

function HalfPrices({
  spot,
  half,
  weighted,
}: {
  spot: readonly SpotSlot[] | undefined
  half: Hz
  weighted: number | null
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const areas = areasOf(half)
  const spread = spreadStats(spot, areas)
  if (!spread) return null
  const floors = areas.reduce((sum, a) => sum + floorSlots(spot, a), 0)
  const where = ({ slot, area }: { slot: number; area: PricedArea }) => `${slotStart(slot)} ${areaName(area, lang)}`
  return (
    <section aria-label={s.day.prices}>
      <dl className={styles.figures}>
        {weighted !== null && (
          <>
            <dt>{s.day.price}</dt>
            <dd>
              {yen(weighted)} <span className="muted">{s.readout.yenPerKwh}</span>
            </dd>
          </>
        )}
        <dt>{s.day.lowPrice}</dt>
        <dd>
          {yen(spread.low.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {where(spread.low)}
          </span>
        </dd>
        <dt>{s.day.highPrice}</dt>
        <dd>
          {yen(spread.high.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {where(spread.high)}
          </span>
        </dd>
        {floors > 0 && (
          <>
            <dt>{s.day.floorArea}</dt>
            <dd>{floors}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
