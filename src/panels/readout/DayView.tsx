import { useStrings } from '../../i18n/useStrings'
import { floorSlots, priceStats, spreadStats, type DayTotals, type JapanDay } from '../../market/daily'
import { SLOTS, type SpotSlot } from '../../market/jepx'
import type { MonthDay, MonthPrice } from '../../market/monthly'
import { SERIES_TOP_DOWN } from '../../market/stack'
import { areasOf, type Hz, type PricedArea } from '../../regions/areas'
import { areaName } from '../../regions/names'
import { gwh, mw, percent, yen } from '../../shared/format'
import { useApp } from '../../store'
import { slotEnd, slotStart } from '../../time/slots'
import MonthStrip from '../MonthStrip'
import { JEPX_FIELDS, RECORD_FIELDS, useProvenance } from '../provenance'
import styles from './DayView.module.css'
import { DayDerived } from './Derived'
import ScopeHeading from './ScopeHeading'
import SourceHeading from './SourceHeading'
import { recordGroup, recordProvenance, scopeHz, type PricedScope } from './scope'

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

/**
 * The whole day, grouped under who published it: JEPX's prices, the record's supply under the scope's name, what this
 * site computes from the two, and the month's days under it all to scrub through.
 */
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
  const derived = totals !== null || price !== null || (scope.kind === 'system' && !!spotDay)
  return (
    <>
      <SourceHeading source={{ kind: 'jepx' }} />
      <DayPrices spot={spotDay} scope={scope} />
      <SourceHeading source={recordGroup(scope)} />
      {scope.kind !== 'area' && <ScopeHeading scope={scope} missing={scoped.missing} />}
      <DaySupply totals={totals} scope={scope} />
      {derived && (
        <>
          <SourceHeading source={{ kind: 'derived' }} />
          <DayDerived scope={scope} spot={spotDay} totals={totals} weighted={price} />
        </>
      )}
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
 * The displayed day in energy as the record gives it: how it was supplied, as one bar and a table of each source's GWh
 * and share, read from the top as the chart stacks, then the day's demand and its shape; or, while the records for it
 * are not all in, a note. The prices stand above it, as the price curve stands above the supply chart.
 */
export function DaySupply({ totals, scope }: { totals: DayTotals | null; scope: PricedScope }) {
  const s = useStrings()
  const p = useProvenance()
  const from = recordProvenance(p, scope)
  const f = s.readout.source.formula
  const area = scope.kind === 'area'
  if (!totals) return <p className="muted">{area ? s.readout.noRecord : s.day.notAll}</p>
  const supply = [
    {
      key: 'imports',
      name: s.chart.imports,
      color: 'var(--src-exchange)',
      mwh: area ? totals.importMWh : 0,
      field: RECORD_FIELDS.lines,
    },
    {
      key: 'storageOut',
      name: s.chart.storageOut,
      color: 'var(--src-storage)',
      mwh: totals.storageOutMWh,
      field: RECORD_FIELDS.storage,
    },
    ...SERIES_TOP_DOWN.map((x) => ({
      key: x,
      name: s.chart.series[x],
      color: `var(--src-${x})`,
      mwh: totals.bySeries[x],
      field: RECORD_FIELDS[x],
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
            <th scope="col" title={p.derived(f.share)}>
              {s.day.share}
            </th>
          </tr>
        </thead>
        <tbody>
          {supply.map((r) => (
            <tr key={r.key}>
              <th scope="row" title={from(r.field)}>
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
        <dt title={from(RECORD_FIELDS.demand)}>{s.day.demand}</dt>
        <dd>
          {gwh(totals.demandMWh)} <span className="muted">{s.day.gwh}</span>
        </dd>
        <dt title={from(RECORD_FIELDS.demand, f.peak)}>{s.day.peak}</dt>
        <dd>
          {mw(totals.peak.mw)} <span className="muted">MW · {slotStart(totals.peak.slot)}</span>
        </dd>
        <dt title={from(RECORD_FIELDS.demand, f.low)}>{s.day.low}</dt>
        <dd>
          {mw(totals.low.mw)} <span className="muted">MW · {slotStart(totals.low.slot)}</span>
        </dd>
        {totals.curtailedMWh > 0 && (
          <>
            <dt title={from(RECORD_FIELDS.curtailed)}>{s.day.curtailed}</dt>
            <dd>
              {gwh(totals.curtailedMWh)} <span className="muted">{s.day.gwh}</span>
            </dd>
          </>
        )}
        {area && totals.exportMWh > 0 && (
          <>
            <dt title={from(RECORD_FIELDS.lines)}>{s.day.exported}</dt>
            <dd>
              {gwh(totals.exportMWh)} <span className="muted">{s.day.gwh}</span>
            </dd>
          </>
        )}
        {totals.storageInMWh > 0 && (
          <>
            <dt title={from(RECORD_FIELDS.storage)}>{s.day.storedIn}</dt>
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
 * The displayed day in price, as JEPX's file gives it: the mean, the low and the high with when, and the half hours at
 * the floor; they stand for any priced day, since the auction runs a day ahead of the record. For a half of the grid,
 * which has no price of its own, the lowest and the highest across its areas with where and when, and the area half
 * hours at the floor. The price weighted by demand and the turnover are computed, and stand with the derived figures.
 */
export function DayPrices({ spot, scope }: { spot: readonly SpotSlot[] | undefined; scope: PricedScope }) {
  const s = useStrings()
  const p = useProvenance()
  const f = s.readout.source.formula
  if (scope.kind === 'half') return <HalfPrices spot={spot} half={scope.half} />
  const area = scope.kind === 'area' ? scope.area : undefined
  const stats = priceStats(spot, area)
  if (!stats) return null
  const floors = floorSlots(spot, area)
  const field = area ? JEPX_FIELDS.areaPrice(area) : JEPX_FIELDS.systemPrice
  return (
    <section aria-label={s.day.prices}>
      <dl className={styles.figures}>
        <dt title={p.jepx(field, f.mean)}>{s.day.meanPrice}</dt>
        <dd>
          {yen(stats.mean)} <span className="muted">{s.readout.yenPerKwh}</span>
        </dd>
        <dt title={p.jepx(field, f.low)}>{s.day.lowPrice}</dt>
        <dd>
          {yen(stats.low.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {slotStart(stats.low.slot)}
          </span>
        </dd>
        <dt title={p.jepx(field, f.peak)}>{s.day.highPrice}</dt>
        <dd>
          {yen(stats.high.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {slotStart(stats.high.slot)}
          </span>
        </dd>
        {floors > 0 && (
          <>
            <dt title={p.jepx(field, f.floor)}>{s.day.floor}</dt>
            <dd>{floors}</dd>
          </>
        )}
      </dl>
    </section>
  )
}

function HalfPrices({ spot, half }: { spot: readonly SpotSlot[] | undefined; half: Hz }) {
  const s = useStrings()
  const p = useProvenance()
  const f = s.readout.source.formula
  const lang = useApp((x) => x.lang)
  const areas = areasOf(half)
  const spread = spreadStats(spot, areas)
  if (!spread) return null
  const floors = areas.reduce((sum, a) => sum + floorSlots(spot, a), 0)
  const where = ({ slot, area }: { slot: number; area: PricedArea }) => `${slotStart(slot)} ${areaName(area, lang)}`
  return (
    <section aria-label={s.day.prices}>
      <dl className={styles.figures}>
        <dt title={p.jepx(JEPX_FIELDS.areaPrices, f.low)}>{s.day.lowPrice}</dt>
        <dd>
          {yen(spread.low.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {where(spread.low)}
          </span>
        </dd>
        <dt title={p.jepx(JEPX_FIELDS.areaPrices, f.peak)}>{s.day.highPrice}</dt>
        <dd>
          {yen(spread.high.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {where(spread.high)}
          </span>
        </dd>
        {floors > 0 && (
          <>
            <dt title={p.jepx(JEPX_FIELDS.areaPrices, f.floor)}>{s.day.floorArea}</dt>
            <dd>{floors}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
