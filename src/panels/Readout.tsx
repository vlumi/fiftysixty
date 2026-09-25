import { Fragment, useState } from 'react'
import type { PricedArea, SpotSlot } from '../market/jepx'
import { capacityOf, type FlowSlot } from '../market/flows'
import { SOURCES, type RecordSlot, type Source } from '../market/record'
import { AREA_BY_ID, PRICED_AREAS, type Area } from '../regions/areas'
import { linesOf, neighbors } from '../regions/interconnectors'
import type { PlantProps } from '../regions/plants'
import { SERIES_NAMES } from '../market/stack'
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
 * The displayed slot in numbers: the system price and the spread across the areas, or a picked area against its
 * neighbors and what ran in it.
 */
export default function Readout({ slot, record, day, flows, area, plant, onClose, onSlot }: Props) {
  const narrow = useNarrow()
  // On a phone the panel opens on its headline alone, since the map is what the screen is for; the rest is
  // remembered for the area it was asked for, so another area opens folded again.
  const [expandedFor, setExpandedFor] = useState<Area | null>(null)
  const expanded = expandedFor !== null && expandedFor === area
  if (!slot) return null
  if (plant) {
    return (
      <aside className={styles.panel} aria-label="Readout">
        <button className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>
        <h2>{plant.name || 'A plant'}</h2>
        <p className={styles.price}>
          {mw(plant.mw)} <span className="muted">MW</span>
        </p>
        <p className="muted">
          {SERIES_NAMES[plant.fuel]}. Capacity as mapped in OpenStreetMap; what it runs is not public.
        </p>
      </aside>
    )
  }
  const picked = area && area !== 'okinawa' ? (area as PricedArea) : null
  return (
    <aside className={styles.panel} aria-label="Readout">
      {picked ? (
        <>
          <AreaReadout area={picked} slot={slot} onClose={onClose} brief={narrow && !expanded} />
          {narrow && (
            <button
              className={styles.more}
              aria-expanded={expanded}
              onClick={() => setExpandedFor(expanded ? null : area)}
            >
              {expanded ? 'Less' : 'More'}
            </button>
          )}
          {(!narrow || expanded) && (
            <>
              <Lines area={picked} flows={flows} />
              {day?.length ? <SupplyChart day={day} slot={slot.slot} onSlot={onSlot} /> : null}
              <Mix record={record} />
            </>
          )}
        </>
      ) : (
        <SystemReadout slot={slot} okinawa={area === 'okinawa'} />
      )}
    </aside>
  )
}

function SystemReadout({ slot, okinawa }: { slot: SpotSlot; okinawa: boolean }) {
  const prices = PRICED_AREAS.map((a) => slot.areaPrice[a.id as PricedArea])
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return (
    <>
      <h2>System price</h2>
      <p className={styles.price}>
        {yen(slot.systemPrice)} <span className="muted">¥/kWh</span>
      </p>
      <p className="muted">
        {low === high ? 'Every area at the system price.' : `Areas from ${yen(low)} to ${yen(high)}.`}
        {okinawa ? ' Okinawa is not on the exchange.' : ' Pick an area for its price.'}
      </p>
    </>
  )
}

function AreaReadout({
  area,
  slot,
  onClose,
  brief = false,
}: {
  area: PricedArea
  slot: SpotSlot
  onClose: () => void
  /** The name and the price alone, without the neighbors. */
  brief?: boolean
}) {
  const info = AREA_BY_ID[area]
  const price = slot.areaPrice[area]
  return (
    <>
      <button className={styles.close} aria-label="Close" onClick={onClose}>
        ×
      </button>
      <h2>
        {info.name} <span className="muted">{info.hz} Hz</span>
      </h2>
      <p className={styles.price}>
        {yen(price)} <span className="muted">¥/kWh</span>
      </p>
      <dl className={styles.rows}>
        <dt>System</dt>
        <dd>
          {yen(slot.systemPrice)} <span className="muted">{signed(slot.systemPrice - price)}</span>
        </dd>
        {!brief &&
          neighbors(area).map((n) => (
            <Neighbor key={n} area={n as PricedArea} price={slot.areaPrice[n as PricedArea]} against={price} />
          ))}
      </dl>
    </>
  )
}

function Neighbor({ area, price, against }: { area: PricedArea; price: number; against: number }) {
  return (
    <>
      <dt>{AREA_BY_ID[area].name}</dt>
      <dd>
        {yen(price)} <span className="muted">{signed(price - against)}</span>
      </dd>
    </>
  )
}

const SOURCE_NAMES: Record<Source, string> = {
  nuclear: 'Nuclear',
  lng: 'Gas',
  coal: 'Coal',
  oil: 'Oil',
  otherThermal: 'Other thermal',
  hydro: 'Hydro',
  geothermal: 'Geothermal',
  biomass: 'Biomass',
  solar: 'Solar',
  wind: 'Wind',
  pumped: 'Pumped storage',
  battery: 'Batteries',
  interconnector: 'Interconnectors',
  other: 'Other',
}

/** What ran in the area for the slot, in MW, the sources that were idle left out; curtailment when there was any. */
function Mix({ record }: { record: RecordSlot | undefined }) {
  if (!record) return <p className="muted">No record for this half hour yet.</p>
  const ran = SOURCES.filter((s) => record.bySource[s] !== 0)
  return (
    <section aria-label="What ran">
      <h3>
        Demand {mw(record.demandMW)} <span className="muted">MW</span>
      </h3>
      <dl className={styles.rows}>
        {ran.map((s) => (
          <Row key={s} name={SOURCE_NAMES[s]} value={record.bySource[s]} />
        ))}
        {record.curtailedMW.solar > 0 && <Row name="Solar curtailed" value={record.curtailedMW.solar} />}
        {record.curtailedMW.wind > 0 && <Row name="Wind curtailed" value={record.curtailedMW.wind} />}
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
  const rows = linesOf(area).flatMap((line) => {
    const at = flows.get(line.id)
    if (!at) return []
    const forward = at.flowMW >= 0
    const inward = (line.to === area) === forward
    return [
      { id: line.id, label: line.label, inward, mw: Math.abs(at.flowMW), capacity: capacityOf(at), split: at.split },
    ]
  })
  if (!rows.length) return null
  return (
    <section aria-label="Lines">
      <h3>Lines</h3>
      <dl className={styles.rows}>
        {rows.map((r) => (
          <Fragment key={r.id}>
            <dt>
              {r.label} {r.split && <span className={styles.split}>split</span>}
            </dt>
            <dd>
              <span className="muted">{r.inward ? 'in' : 'out'}</span> {mw(r.mw)}{' '}
              <span className="muted">of {mw(r.capacity)}</span>
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}
