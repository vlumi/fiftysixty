import { Fragment, useState } from 'react'
import { useStrings } from '../i18n/useStrings'
import { useApp } from '../store'
import type { PricedArea, SpotSlot } from '../market/jepx'
import type { Interchange } from '../market/interchange'
import type { RecordSlot } from '../market/record'
import { AREA_BY_ID, PRICED_AREAS, type Area } from '../regions/areas'
import { neighbors, OCCTO_LINE_IDS } from '../regions/interconnectors'
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
  /** The half hour's flows between the areas, recorded or planned. */
  interchange: Interchange | null
  area: Area | null
  /** A picked plant, shown instead of an area. */
  plant?: PlantProps | null
  /** Up a level: from a plant to the map, from an area to the system price. */
  onBack: () => void
  onSlot: (slot: number) => void
}

/**
 * The displayed slot in numbers: the system price and the spread across the areas, a picked area against its
 * neighbors and what ran in it, or a picked plant. On a phone it is an accordion: the headline row alone until tapped,
 * remembered for what it was opened for, so another pick opens folded again.
 */
export default function Readout({ slot, record, day, interchange, area, plant, onBack, onSlot }: Props) {
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
      <Lines area={picked} interchange={interchange} />
      {day?.length ? <SupplyChart day={day} slot={slot.slot} onSlot={onSlot} /> : null}
      {!record && <p className="muted">{s.readout.noRecord}</p>}
    </>
  ) : (
    <SystemNote slot={slot} okinawa={area === 'okinawa'} />
  )
  return (
    <aside className={styles.panel} aria-label={s.readout.label}>
      <div className={styles.head}>
        {(plant || picked) && (
          <button className={styles.back} aria-label={s.readout.back} onClick={onBack}>
            <Chevron turn={90} />
          </button>
        )}
        {narrow ? (
          <button className={styles.fold} aria-expanded={open} onClick={() => setOpenFor(open ? null : key)}>
            {head}
            <span className={styles.chevron}>
              <Chevron turn={open ? 180 : 0} />
            </span>
          </button>
        ) : (
          <div className={styles.fold}>{head}</div>
        )}
      </div>
      {open && <div className={styles.body}>{body}</div>}
    </aside>
  )
}

/** A chevron pointing down, turned clockwise by `turn` degrees. */
function Chevron({ turn }: { turn: number }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ transform: `rotate(${turn}deg)` }}>
      <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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

/** The area's lines for the slot as OCCTO forecast them: the flow toward or away from the area against the limit, and a split. */
function Lines({ area, interchange }: { area: PricedArea; interchange: Interchange | null }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  if (!interchange) return null
  const name = (a: Area) => (lang === 'ja' ? AREA_BY_ID[a].ja : AREA_BY_ID[a].name)
  const lines = interchange.links
    .filter((l) => l.from === area || l.to === area)
    .map((l) => {
      const line = OCCTO_LINE_IDS.find((x) => x.id === l.id)!
      return {
        id: l.id,
        label: lang === 'ja' ? line.name : line.label,
        inward: l.to === area,
        mw: l.mw,
        capacity: l.capacityMW,
        split: l.split,
      }
    })
  // A loop gives the area's total across its two lines of it, not how that divides between them.
  const loops = interchange.forks.flatMap((f) => {
    const total = f.totals[area]
    if (total === undefined) return []
    const [a, b] = (Object.keys(f.totals) as Area[]).filter((x) => x !== area)
    return [
      {
        id: f.id,
        label: s.readout.loopWith(name(a), name(b)),
        inward: total >= 0,
        mw: Math.abs(total),
        capacity: undefined,
        split: false,
      },
    ]
  })
  const rows = [...lines, ...loops]
  if (!rows.length) return null
  return (
    <section aria-label={s.readout.lines}>
      <h3>
        {s.readout.lines}{' '}
        <span className="muted">· {interchange.source === 'recorded' ? s.readout.recorded : s.readout.planned}</span>
      </h3>
      <dl className={styles.rows}>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <dt>
              {r.label} {r.split && <span className={styles.split}>{s.readout.split}</span>}
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
  )
}
