import { Fragment } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { JapanDay } from '../../market/daily'
import type { Interchange } from '../../market/interchange'
import { slotSpread, type SpotSlot } from '../../market/jepx'
import type { RecordSlot } from '../../market/record'
import { areasOf, type PricedArea } from '../../regions/areas'
import { neighbors } from '../../regions/interconnectors'
import { areaName } from '../../regions/names'
import { signed, yen } from '../../shared/format'
import { useApp } from '../../store'
import AuctionChart from '../AuctionChart'
import PriceChart from '../PriceChart'
import SupplyChart from '../SupplyChart'
import Lines from './Lines'
import styles from './Readout.module.css'
import ScopeHeading from './ScopeHeading'
import type { PricedScope } from './scope'

interface Props {
  scope: PricedScope
  slot: SpotSlot
  /** The picked area's record for the half hour and for the day, as far as published. */
  record: RecordSlot | undefined
  recordDay: readonly RecordSlot[] | undefined
  spotDay: readonly SpotSlot[] | undefined
  /** The half's or all Japan's half hours of the day summed, where every area has one. */
  scoped: JapanDay
  interchange: Interchange | null
  onSlot: (slot: number) => void
}

/**
 * The half hour in numbers: a picked area against the system price and its neighbors, then its lines and its day's
 * price curve over its supply; or a half's areas against the system price and the frequency converters as its lines;
 * or with nothing chosen the spread across the areas; the price curve over the auction behind the system price, and
 * the scope's supply summed under its name.
 */
export default function SlotView({ scope, slot, record, recordDay, spotDay, scoped, interchange, onSlot }: Props) {
  const s = useStrings()
  if (scope.kind === 'area') {
    const { area } = scope
    const price = slot.areaPrice[area]
    return (
      <>
        <PriceRows
          rows={[
            { key: 'system', area: null, price: slot.systemPrice, delta: slot.systemPrice - price },
            ...neighbors(area).map((n) => ({
              key: n,
              area: n,
              price: slot.areaPrice[n],
              delta: slot.areaPrice[n] - price,
            })),
          ]}
        />
        <Lines scope={scope} interchange={interchange} />
        {spotDay && (
          <PriceChart day={spotDay} area={area} slot={slot.slot} onSlot={onSlot} hours={!recordDay?.length} />
        )}
        {recordDay?.length ? <SupplyChart day={recordDay} slot={slot.slot} onSlot={onSlot} /> : null}
        {!record && <p className="muted">{s.readout.noRecord}</p>}
      </>
    )
  }
  return (
    <>
      {scope.kind === 'half' ? (
        <>
          <PriceRows
            rows={[
              { key: 'system', area: null, price: slot.systemPrice },
              ...areasOf(scope.half).map((a) => ({
                key: a,
                area: a,
                price: slot.areaPrice[a],
                delta: slot.areaPrice[a] - slot.systemPrice,
              })),
            ]}
          />
          <Lines scope={scope} interchange={interchange} />
        </>
      ) : (
        <SystemNote slot={slot} />
      )}
      {spotDay && (
        <>
          <PriceChart day={spotDay} area={null} slot={slot.slot} onSlot={onSlot} hours={false} />
          <AuctionChart day={spotDay} slot={slot.slot} onSlot={onSlot} hours={!scoped.slots.length} />
        </>
      )}
      {scoped.slots.length > 0 && (
        <>
          <ScopeHeading scope={scope} missing={scoped.missing} />
          <SupplyChart day={scoped.slots} slot={slot.slot} onSlot={onSlot} />
          {!scoped.slots.some((r) => r.slot === slot.slot) && <p className="muted">{s.readout.notAllSlot}</p>}
        </>
      )}
    </>
  )
}

/** Prices in rows, the system price or an area's, each with its difference from what it stands against. */
function PriceRows({
  rows,
}: {
  rows: readonly { key: string; area: PricedArea | null; price: number; delta?: number }[]
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  return (
    <dl className={styles.rows}>
      {rows.map((r) => (
        <Fragment key={r.key}>
          <dt>{r.area ? areaName(r.area, lang) : s.readout.system}</dt>
          <dd>
            {yen(r.price)}
            {r.delta !== undefined && (
              <>
                {' '}
                <span className="muted">{signed(r.delta)}</span>
              </>
            )}
          </dd>
        </Fragment>
      ))}
    </dl>
  )
}

/** The spread across the areas for the half hour, and a word for Okinawa, which has no price, or to pick an area. */
export function SystemNote({ slot, okinawa = false }: { slot: SpotSlot; okinawa?: boolean }) {
  const s = useStrings()
  const [low, high] = slotSpread(slot, areasOf(null))
  return (
    <p className="muted">
      {low === high ? s.readout.everyAreaSystem : s.readout.spread(yen(low), yen(high))}{' '}
      {okinawa ? s.readout.okinawa : s.readout.pickArea}
    </p>
  )
}
