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
import { JEPX_FIELDS, useProvenance } from '../provenance'
import SupplyChart from '../SupplyChart'
import { SlotDerived } from './Derived'
import Lines from './Lines'
import styles from './Readout.module.css'
import ScopeHeading from './ScopeHeading'
import SourceHeading from './SourceHeading'
import { recordGroup, recordProvenance, type PricedScope } from './scope'

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
 * The half hour in numbers, grouped under who published them. JEPX's auction first: a picked area against the system
 * price and its neighbors, a half's areas against the system price, or with nothing chosen the spread across the
 * areas, then the day's price curve, and for the system the auction behind it. Then the lines, under OCCTO's plan
 * when that is what the half hour has; then the record, the area's company's or the companies' summed under the
 * scope's name, with the lines when the records settle them; and last what this site computes from the record.
 */
export default function SlotView({ scope, slot, record, recordDay, spotDay, scoped, interchange, onSlot }: Props) {
  const s = useStrings()
  const p = useProvenance()
  const planned = interchange?.source === 'planned'
  const lines = scope.kind !== 'system' && <Lines scope={scope} interchange={interchange} />
  const prices =
    scope.kind === 'area' ? (
      <PriceRows
        rows={[
          {
            key: 'system',
            area: null,
            price: slot.systemPrice,
            delta: slot.systemPrice - slot.areaPrice[scope.area],
            title: p.jepx(JEPX_FIELDS.systemPrice),
          },
          ...neighbors(scope.area).map((n) => ({
            key: n,
            area: n,
            price: slot.areaPrice[n],
            delta: slot.areaPrice[n] - slot.areaPrice[scope.area],
            title: p.jepx(JEPX_FIELDS.areaPrice(n)),
          })),
        ]}
      />
    ) : scope.kind === 'half' ? (
      <PriceRows
        rows={[
          { key: 'system', area: null, price: slot.systemPrice, title: p.jepx(JEPX_FIELDS.systemPrice) },
          ...areasOf(scope.half).map((a) => ({
            key: a,
            area: a,
            price: slot.areaPrice[a],
            delta: slot.areaPrice[a] - slot.systemPrice,
            title: p.jepx(JEPX_FIELDS.areaPrice(a)),
          })),
        ]}
      />
    ) : (
      <SystemNote slot={slot} />
    )
  const area = scope.kind === 'area' ? scope.area : null
  const half = area ? record : scoped.slots.find((r) => r.slot === slot.slot)
  const supply = area ? recordDay : scoped.slots
  return (
    <>
      <SourceHeading source={{ kind: 'jepx' }} />
      {prices}
      {spotDay && (
        <>
          <PriceChart day={spotDay} area={area} slot={slot.slot} onSlot={onSlot} hours={!!area} />
          {!area && <AuctionChart day={spotDay} slot={slot.slot} onSlot={onSlot} />}
        </>
      )}
      {planned && lines}
      <SourceHeading source={recordGroup(scope)} />
      {!planned && lines}
      {scope.kind !== 'area' && <ScopeHeading scope={scope} missing={scoped.missing} />}
      {supply?.length ? (
        <SupplyChart day={supply} slot={slot.slot} onSlot={onSlot} provenance={recordProvenance(p, scope)} />
      ) : null}
      {!half && (
        <p className="muted">{area ? s.readout.noRecord : supply?.length ? s.readout.notAllSlot : s.day.notAll}</p>
      )}
      {half && (
        <>
          <SourceHeading source={{ kind: 'derived' }} />
          <SlotDerived record={half} />
        </>
      )}
    </>
  )
}

/** Prices in rows, the system price or an area's, each with its difference from what it stands against. */
function PriceRows({
  rows,
}: {
  rows: readonly { key: string; area: PricedArea | null; price: number; delta?: number; title: string }[]
}) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  return (
    <dl className={styles.rows}>
      {rows.map((r) => (
        <Fragment key={r.key}>
          <dt title={r.title}>{r.area ? areaName(r.area, lang) : s.readout.system}</dt>
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
