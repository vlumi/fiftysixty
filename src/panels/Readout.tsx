import { Fragment, useState } from 'react'
import { useStrings } from '../i18n/useStrings'
import { useApp } from '../store'
import type { PricedArea, SpotSlot } from '../market/jepx'
import { capacityOf, type FlowSlot } from '../market/flows'
import { SOURCES, type RecordSlot } from '../market/record'
import { AREA_BY_ID, PRICED_AREAS, type Area } from '../regions/areas'
import { linesOf, neighbors } from '../regions/interconnectors'
import type { PlantProps } from '../regions/plants'
import { mw, signed, yen } from '../shared/format'
import { useNarrow } from '../shared/useNarrow'
import styles from './Readout.module.css'
import SupplyChart from './SupplyChart'

interface Props {
  slot: SpotSlot | undefined
  /** The picked area's balance for the slot, where its transmission company is wired and has published it. */
  record: RecordSlot | undefined
  /** The same for the whole displayed day, as far as it is published. */
  day: readonly RecordSlot[] | undefined
  /** OCCTO's forecast for the slot's interconnectors, by line id. */
  flows: ReadonlyMap<string, FlowSlot>
  area: Area | null
  /** A picked plant, shown instead of an area. */
  plant?: PlantProps | null
  onClose: () => void
  onSlot: (slot: number) => void
}

/**
 * The displayed slot in numbers: the system price and the spread across the areas, a picked area against its
 * neighbors and what ran in it, or a picked plant. On a phone it is an accordion: the headline row alone until tapped,
 * remembered for what it was opened for, so another pick opens folded again.
 */
export default function Readout({ slot, record, day, flows, area, plant, onClose, onSlot }: Props) {
  const s = useStrings()
  const narrow = useNarrow()
  const [openFor, setOpenFor] = useState<string | null>(null)
  if (!slot) return null
  const picked = area && area !== 'okinawa' ? (area as PricedArea) : null
  const key = plant ? `plant/${plant.id}` : (picked ?? 'system')
  const open = !narrow || openFor === key
  const head = plant ? (
    <PlantHead plant={plant} />
  ) : picked ? (
    <AreaHead area={picked} slot={slot} />
  ) : (
    <SystemHead slot={slot} />
  )
  const body = plant ? (
    <p className="muted">{s.readout.plantNote}</p>
  ) : picked ? (
    <>
      <AreaRows area={picked} slot={slot} />
      <Lines area={picked} flows={flows} />
      {day?.length ? <SupplyChart day={day} slot={slot.slot} onSlot={onSlot} /> : null}
      <Mix record={record} />
    </>
  ) : (
    <SystemNote slot={slot} okinawa={area === 'okinawa'} />
  )
  return (
    <aside className={styles.panel} aria-label={s.readout.label}>
      <div className={styles.head}>
        {narrow ? (
          <button className={styles.fold} aria-expanded={open} onClick={() => setOpenFor(open ? null : key)}>
            {head}
            <span className={styles.chevron} aria-hidden="true">
              {open ? '▴' : '▾'}
            </span>
          </button>
        ) : (
          <div className={styles.fold}>{head}</div>
        )}
        {(plant || picked) && (
          <button className={styles.close} aria-label={s.readout.close} onClick={onClose}>
            ×
          </button>
        )}
      </div>
      {open && <div className={styles.body}>{body}</div>}
    </aside>
  )
}

function PlantHead({ plant }: { plant: PlantProps }) {
  const s = useStrings()
  return (
    <>
      <h2>{plant.name || s.readout.aPlant}</h2>
      <p className={styles.price}>
        {mw(plant.mw)} <span className="muted">{s.readout.mw}</span>{' '}
        <span className={`${styles.pill} ${styles[plant.fuel]}`}>{s.chart.series[plant.fuel]}</span>
      </p>
    </>
  )
}

function SystemHead({ slot }: { slot: SpotSlot }) {
  const s = useStrings()
  return (
    <>
      <h2>{s.readout.systemPrice}</h2>
      <p className={styles.price}>
        {yen(slot.systemPrice)} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
  )
}

function SystemNote({ slot, okinawa }: { slot: SpotSlot; okinawa: boolean }) {
  const s = useStrings()
  const prices = PRICED_AREAS.map((a) => slot.areaPrice[a.id as PricedArea])
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return (
    <p className="muted">
      {low === high ? s.readout.everyAreaSystem : s.readout.spread(yen(low), yen(high))}{' '}
      {okinawa ? s.readout.okinawa : s.readout.pickArea}
    </p>
  )
}

function AreaHead({ area, slot }: { area: PricedArea; slot: SpotSlot }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const info = AREA_BY_ID[area]
  return (
    <>
      <h2>
        {lang === 'ja' ? info.ja : info.name} <span className="muted">{s.readout.hz(info.hz)}</span>
      </h2>
      <p className={styles.price}>
        {yen(slot.areaPrice[area])} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
  )
}

function AreaRows({ area, slot }: { area: PricedArea; slot: SpotSlot }) {
  const s = useStrings()
  const price = slot.areaPrice[area]
  return (
    <dl className={styles.rows}>
      <dt>{s.readout.system}</dt>
      <dd>
        {yen(slot.systemPrice)} <span className="muted">{signed(slot.systemPrice - price)}</span>
      </dd>
      {neighbors(area).map((n) => (
        <Neighbor key={n} area={n as PricedArea} price={slot.areaPrice[n as PricedArea]} against={price} />
      ))}
    </dl>
  )
}

function Neighbor({ area, price, against }: { area: PricedArea; price: number; against: number }) {
  const lang = useApp((x) => x.lang)
  return (
    <>
      <dt>{lang === 'ja' ? AREA_BY_ID[area].ja : AREA_BY_ID[area].name}</dt>
      <dd>
        {yen(price)} <span className="muted">{signed(price - against)}</span>
      </dd>
    </>
  )
}

/** What ran in the area for the slot, in MW, the sources that were idle left out; curtailment when there was any. */
function Mix({ record }: { record: RecordSlot | undefined }) {
  const s = useStrings()
  if (!record) return <p className="muted">{s.readout.noRecord}</p>
  const ran = SOURCES.filter((x) => record.bySource[x] !== 0)
  return (
    <section aria-label={s.readout.whatRan}>
      <h3>
        {s.readout.demand} {mw(record.demandMW)} <span className="muted">{s.readout.mw}</span>
      </h3>
      <dl className={styles.rows}>
        {ran.map((x) => (
          <Row key={x} name={s.readout.sources[x]} value={record.bySource[x]} />
        ))}
        {record.curtailedMW.solar > 0 && <Row name={s.readout.solarCurtailed} value={record.curtailedMW.solar} />}
        {record.curtailedMW.wind > 0 && <Row name={s.readout.windCurtailed} value={record.curtailedMW.wind} />}
      </dl>
    </section>
  )
}

function Row({ name, value }: { name: string; value: number }) {
  return (
    <>
      <dt>{name}</dt>
      <dd>{mw(value)}</dd>
    </>
  )
}

/** The area's lines for the slot as OCCTO forecast them: the flow toward or away from the area against the limit, and a split. */
function Lines({ area, flows }: { area: PricedArea; flows: ReadonlyMap<string, FlowSlot> }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  const rows = linesOf(area).flatMap((line) => {
    const at = flows.get(line.id)
    if (!at) return []
    const forward = at.flowMW >= 0
    const inward = (line.to === area) === forward
    return [
      {
        id: line.id,
        label: lang === 'ja' ? line.name : line.label,
        inward,
        mw: Math.abs(at.flowMW),
        capacity: capacityOf(at),
        split: at.split,
      },
    ]
  })
  if (!rows.length) return null
  return (
    <section aria-label={s.readout.lines}>
      <h3>{s.readout.lines}</h3>
      <dl className={styles.rows}>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <dt>
              {r.label} {r.split && <span className={styles.split}>{s.readout.split}</span>}
            </dt>
            <dd>
              <span className="muted">{r.inward ? s.readout.in : s.readout.out}</span> {mw(r.mw)}{' '}
              <span className="muted">
                {s.readout.of} {mw(r.capacity)}
              </span>
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}
