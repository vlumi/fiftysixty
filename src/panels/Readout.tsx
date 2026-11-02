import { Fragment, useState } from 'react'
import { useStrings } from '../i18n/useStrings'
import { useApp } from '../store'
import type { PricedArea, SpotSlot } from '../market/jepx'
import type { DayTotals, JapanDay } from '../market/daily'
import type { HistoryDay } from '../market/history'
import type { Interchange } from '../market/interchange'
import type { RecordSlot } from '../market/record'
import { AREA_BY_ID, PRICED_AREAS, type Area, type Hz } from '../regions/areas'
import { neighbors, OCCTO_LINE_IDS } from '../regions/interconnectors'
import { areaList } from '../regions/names'
import type { PlantProps } from '../regions/plants'
import { mw, signed, yen } from '../shared/format'
import { useNarrow } from '../shared/useNarrow'
import styles from './Readout.module.css'
import AuctionChart from './AuctionChart'
import { DayPrices, DaySupply } from './DayView'
import MonthStrip, { type MonthDay, type MonthPrice } from './MonthStrip'
import PriceChart from './PriceChart'
import PriceHistory from './PriceHistory'
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
  /** The displayed day for the picked area, or for all Japan with none picked; its weighted price and its prices. */
  dayTotals?: DayTotals | null
  dayPrice?: number | null
  /** The displayed day's auction, for the price curve and the day's price figures. */
  spotDay?: readonly SpotSlot[]
  /** All Japan's, or the chosen half's, half hours of the displayed day, where every area has one, for the readout with nothing picked. */
  japan?: JapanDay
  /** The displayed month's whole days with their totals, and its priced days with their figures, for the strip under the day. */
  monthDays?: readonly MonthDay[]
  monthPrices?: readonly MonthPrice[]
  /** Every priced day held, the picked area's price or the system's, for the history view. */
  history?: readonly HistoryDay[]
  date?: string | null
  onDate?: (date: string) => void
  area: Area | null
  /** A picked plant, shown instead of an area. */
  plant?: PlantProps | null
  /** Up a level: from a plant to the map, from an area to the system price. */
  onBack: () => void
  onSlot: (slot: number) => void
}

/**
 * The displayed slot in numbers: the system price and the spread across the areas, or with a half of the grid chosen
 * from its control, that half's spread, its areas against the system price, the frequency converters as its lines
 * and what ran in it summed, a picked area against its neighbors and what ran in it, or a picked plant. On a phone it is an accordion: the headline row alone until tapped, remembered for what it
 * was opened for, so another pick opens folded again.
 */
export default function Readout({
  slot,
  record,
  day,
  interchange,
  area,
  plant,
  dayTotals = null,
  dayPrice = null,
  spotDay,
  monthDays = [],
  monthPrices = [],
  history = [],
  japan = { slots: [], missing: [] },
  date = null,
  onDate,
  onBack,
  onSlot,
}: Props) {
  const s = useStrings()
  const view = useApp((x) => x.view)
  const setView = useApp((x) => x.setView)
  const half = useApp((x) => x.half)
  const setHalf = useApp((x) => x.setHalf)
  const narrow = useNarrow()
  const [openFor, setOpenFor] = useState<string | null>(null)
  if (!slot) return null
  const picked = area && area !== 'okinawa' ? (area as PricedArea) : null
  // A half is a scope, not a pick, so choosing one from inside the open panel leaves it open.
  const key = plant ? `plant/${plant.id}` : (picked ?? 'system')
  const open = !narrow || openFor === key
  const head = plant ? (
    <PlantHead plant={plant} />
  ) : picked ? (
    <AreaHead area={picked} slot={slot} />
  ) : half ? (
    <HalfHead half={half} slot={slot} />
  ) : (
    <SystemHead slot={slot} />
  )
  const views = (
    <div className={styles.switches}>
      {!picked && (
        <div className={`${styles.views} ${styles.scope}`} role="group" aria-label={s.readout.half}>
          <button aria-pressed={half === null} onClick={() => setHalf(null)}>
            {s.day.japan}
          </button>
          {([50, 60] as const).map((hz) => (
            <button key={hz} className={styles[`hz${hz}`]} aria-pressed={half === hz} onClick={() => setHalf(hz)}>
              {s.readout.hz(hz)}
            </button>
          ))}
        </div>
      )}
      <div className={styles.views} role="group" aria-label={s.day.view}>
        {(['slot', 'day', 'history'] as const).map((v) => (
          <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
            {v === 'slot' ? s.day.halfHour : v === 'day' ? s.day.day : s.day.history}
          </button>
        ))}
      </div>
    </div>
  )
  const body = plant ? (
    <p className="muted">{s.readout.plantNote}</p>
  ) : view === 'day' ? (
    <>
      {views}
      <DayPrices spot={spotDay} area={picked} half={half} weighted={dayPrice} />
      {!picked && <JapanHeading half={half} missing={japan.missing} />}
      <DaySupply totals={dayTotals} area={picked} />
      {onDate && (
        <MonthStrip
          days={monthDays}
          prices={monthPrices}
          hz={picked ? AREA_BY_ID[picked].hz : half}
          weighted={!picked && !!half}
          date={date}
          onPick={onDate}
        />
      )}
    </>
  ) : view === 'history' ? (
    <>
      {views}
      {half && !picked && <p className="muted">{s.readout.halfHistory}</p>}
      <PriceHistory
        days={history}
        area={picked}
        date={date}
        slot={slot.slot}
        onPick={(d, at) => {
          if (d !== date) onDate?.(d)
          onSlot(at)
        }}
      />
    </>
  ) : picked ? (
    <>
      {views}
      <AreaRows area={picked} slot={slot} />
      <Lines area={picked} interchange={interchange} />
      {spotDay && <PriceChart day={spotDay} area={picked} slot={slot.slot} onSlot={onSlot} hours={!day?.length} />}
      {day?.length ? <SupplyChart day={day} slot={slot.slot} onSlot={onSlot} /> : null}
      {!record && <p className="muted">{s.readout.noRecord}</p>}
    </>
  ) : (
    <>
      {area !== 'okinawa' && views}
      {half && area !== 'okinawa' ? (
        <>
          <HalfRows half={half} slot={slot} />
          <Lines area={null} half={half} interchange={interchange} />
        </>
      ) : (
        <SystemNote slot={slot} okinawa={area === 'okinawa'} />
      )}
      {area !== 'okinawa' && spotDay && (
        <>
          <PriceChart day={spotDay} area={null} slot={slot.slot} onSlot={onSlot} hours={false} />
          <AuctionChart day={spotDay} slot={slot.slot} onSlot={onSlot} hours={!japan.slots.length} />
        </>
      )}
      {area !== 'okinawa' && japan.slots.length > 0 && (
        <>
          <JapanHeading half={half} missing={japan.missing} />
          <SupplyChart day={japan.slots} slot={slot.slot} onSlot={onSlot} />
          {!japan.slots.some((r) => r.slot === slot.slot) && <p className="muted">{s.readout.notAllSlot}</p>}
        </>
      )}
    </>
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

/** The lowest and the highest area price of the half hour, across all the areas or a half's. */
function spreadOf(slot: SpotSlot, half: Hz | null): [number, number] {
  const prices = PRICED_AREAS.filter((a) => !half || a.hz === half).map((a) => slot.areaPrice[a.id as PricedArea])
  return [Math.min(...prices), Math.max(...prices)]
}

function SystemNote({ slot, okinawa }: { slot: SpotSlot; okinawa: boolean }) {
  const s = useStrings()
  const [low, high] = spreadOf(slot, null)
  return (
    <p className="muted">
      {low === high ? s.readout.everyAreaSystem : s.readout.spread(yen(low), yen(high))}{' '}
      {okinawa ? s.readout.okinawa : s.readout.pickArea}
    </p>
  )
}

/** A half's half hour in figures: the system price, then each of its areas against it. */
function HalfRows({ half, slot }: { half: Hz; slot: SpotSlot }) {
  const s = useStrings()
  return (
    <dl className={styles.rows}>
      <dt>{s.readout.system}</dt>
      <dd>{yen(slot.systemPrice)}</dd>
      {PRICED_AREAS.filter((a) => a.hz === half).map((a) => (
        <Neighbor
          key={a.id}
          area={a.id as PricedArea}
          price={slot.areaPrice[a.id as PricedArea]}
          against={slot.systemPrice}
        />
      ))}
    </dl>
  )
}

/** A half of the grid as the headline: its areas' price when they agree, else the spread across them. */
function HalfHead({ half, slot }: { half: Hz; slot: SpotSlot }) {
  const s = useStrings()
  const [low, high] = spreadOf(slot, half)
  return (
    <>
      <h2 className={styles[`hz${half}`]}>{s.readout.hz(half)}</h2>
      <p className={styles.price}>
        {low === high ? yen(low) : `${yen(low)}–${yen(high)}`} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
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
/**
 * The lines across the picked area's borders, or across the half's, which are the frequency converters alone, since
 * nothing else crosses the middle: each in or out against its limit, and for an area its loop as the total.
 */
function Lines({
  area,
  half = null,
  interchange,
}: {
  area: PricedArea | null
  half?: Hz | null
  interchange: Interchange | null
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  if (!interchange) return null
  const name = (a: Area) => (lang === 'ja' ? AREA_BY_ID[a].ja : AREA_BY_ID[a].name)
  const mine = (x: Area) => (area ? x === area : AREA_BY_ID[x].hz === half)
  const lines = interchange.links
    .filter((l) => mine(l.from) !== mine(l.to))
    .map((l) => {
      const line = OCCTO_LINE_IDS.find((x) => x.id === l.id)!
      return {
        id: l.id,
        label: lang === 'ja' ? line.name : line.label,
        inward: mine(l.to),
        mw: l.mw,
        capacity: l.capacityMW,
        split: l.split,
      }
    })
  // A loop gives the area's total across its two lines of it, not how that divides between them.
  const loops = interchange.forks.flatMap((f) => {
    const total = area && f.totals[area]
    if (total === undefined || total === null) return []
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

/** All Japan, or the chosen half, and the areas left out of its sums while their records are not in, by name. */
function JapanHeading({ half, missing }: { half: Hz | null; missing: readonly Area[] }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  return (
    <h3>
      {half ? s.readout.hz(half) : s.day.japan}
      {missing.length > 0 && <span className={styles.without}> · {s.day.without(areaList(missing, lang))}</span>}
    </h3>
  )
}
