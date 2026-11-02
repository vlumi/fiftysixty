import { useStrings } from '../i18n/useStrings'
import { co2Intensity, floorSlots, priceStats, renewableShare, spreadStats, type DayTotals } from '../market/daily'
import { SLOTS, type PricedArea, type SpotSlot } from '../market/jepx'
import { SERIES } from '../market/stack'
import { AREA_BY_ID, PRICED_AREAS, type Hz } from '../regions/areas'
import { mw, yen } from '../shared/format'
import { useApp } from '../store'
import { slotRange } from '../time/slots'
import styles from './DayView.module.css'

const GWH = 1000
const gwh = (mwh: number) => (mwh / GWH).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
/** When a half hour begins, as the time bar gives it. */
const startOf = (slot: number) => slotRange(slot).split('–')[0]
const percent = (share: number) => `${Math.round(share * 100)}%`

/** The area, or none for all Japan. */
type Picked = PricedArea | null

/**
 * The displayed day in energy: how it was supplied, as one bar and a table of each source's GWh and share, read from
 * the top as the chart stacks, then the day's figures; or, while the records for it are not all in, a note. The prices
 * stand above it, as the price curve stands above the supply chart.
 */
export function DaySupply({ totals, area }: { totals: DayTotals | null; area: Picked }) {
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
      </dl>
    </section>
  )
}

/**
 * The displayed day in price: the mean, the price weighted by demand where the record allows it, the low and the high
 * with when, and the half hours at the floor; they stand for any priced day, since the auction runs a day ahead of
 * the record. For a half of the grid, which has no price of its own, the figures JEPX's prices give: the lowest and
 * the highest across its areas with where and when, the area half hours at the floor, and the weighted price.
 */
export function DayPrices({
  spot,
  area,
  half = null,
  weighted,
}: {
  spot: readonly SpotSlot[] | undefined
  area: Picked
  /** With nothing picked, the half of the grid the day is scoped to. */
  half?: Hz | null
  /** The price weighted by demand, ¥/kWh, or null without the record. */
  weighted: number | null
}) {
  const s = useStrings()
  if (half && !area) return <HalfPrices spot={spot} half={half} weighted={weighted} />
  const stats = priceStats(spot, area ?? undefined)
  if (!stats) return null
  const floors = floorSlots(spot, area ?? undefined)
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
            {s.readout.yenPerKwh} · {startOf(stats.low.slot)}
          </span>
        </dd>
        <dt>{s.day.highPrice}</dt>
        <dd>
          {yen(stats.high.price)}{' '}
          <span className="muted">
            {s.readout.yenPerKwh} · {startOf(stats.high.slot)}
          </span>
        </dd>
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
  const areas = PRICED_AREAS.filter((a) => a.hz === half).map((a) => a.id as PricedArea)
  const spread = spreadStats(spot, areas)
  if (!spread) return null
  const floors = areas.reduce((sum, a) => sum + floorSlots(spot, a), 0)
  const name = (a: PricedArea) => (lang === 'ja' ? AREA_BY_ID[a].ja : AREA_BY_ID[a].name)
  const where = ({ slot, area }: { slot: number; area: PricedArea }) => `${startOf(slot)} ${name(area)}`
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
