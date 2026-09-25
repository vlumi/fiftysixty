import type { PricedArea, SpotSlot } from '../market/jepx'
import { AREA_BY_ID, PRICED_AREAS, type Area } from '../regions/areas'
import { neighbors } from '../regions/interconnectors'
import { signed, yen } from '../shared/format'
import styles from './Readout.module.css'

interface Props {
  slot: SpotSlot | undefined
  area: Area | null
  onClose: () => void
}

/** The displayed slot in numbers: the system price and the spread across the areas, or a picked area against its neighbors. */
export default function Readout({ slot, area, onClose }: Props) {
  if (!slot) return null
  const picked = area && area !== 'okinawa' ? (area as PricedArea) : null
  return (
    <aside className={styles.panel} aria-label="Readout">
      {picked ? (
        <AreaReadout area={picked} slot={slot} onClose={onClose} />
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

function AreaReadout({ area, slot, onClose }: { area: PricedArea; slot: SpotSlot; onClose: () => void }) {
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
        {neighbors(area).map((n) => (
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
