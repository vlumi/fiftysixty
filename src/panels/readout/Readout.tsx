import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { DayTotals, JapanDay } from '../../market/daily'
import type { Fetched } from '../../market/fetched'
import type { HistoryDay } from '../../market/history'
import type { Interchange } from '../../market/interchange'
import type { SpotSlot } from '../../market/jepx'
import type { MonthDay, MonthPrice } from '../../market/monthly'
import type { RecordSlot } from '../../market/record'
import type { SplitHistory } from '../../market/splits'
import type { Area } from '../../regions/areas'
import type { PlantProps } from '../../regions/plants'
import { useNarrow } from '../../shared/useNarrow'
import { useShort } from '../../shared/useShort'
import { useApp } from '../../store'
import Chevron from '../Chevron'
import { ProvenanceContext } from '../provenance'
import DayView from './DayView'
import Headline from './Headline'
import HistoryView from './HistoryView'
import styles from './Readout.module.css'
import { pickKey, scopeOf } from './scope'
import SlotView, { SystemNote } from './SlotView'
import Switches from './Switches'

interface Props {
  slot: SpotSlot | undefined
  area: Area | null
  plant: PlantProps | null
  /** The picked area's record for the half hour and for the day, as far as its company has published it. */
  record: RecordSlot | undefined
  recordDay: readonly RecordSlot[] | undefined
  /** The half hour's flows between the areas, recorded or planned. */
  interchange: Interchange | null
  /** The displayed day's auction, for the price curve and the day's price figures. */
  spotDay: readonly SpotSlot[] | undefined
  /** The half's or all Japan's half hours of the day summed, where every area has one, with nothing picked. */
  scoped: JapanDay
  /** The displayed day's totals and its price weighted by demand, the picked area's or the scope's. */
  dayTotals: DayTotals | null
  dayPrice: number | null
  /** The displayed month's whole days and its priced days, for the strip under the day. */
  monthDays: readonly MonthDay[]
  monthPrices: readonly MonthPrice[]
  /** Every priced day held, the picked area's price or the system's, for the history view. */
  history: readonly HistoryDay[]
  /** The scope's lines over the same days: their market splits, for the history view. */
  splits: SplitHistory
  date: string | null
  onDate: (date: string) => void
  /** The fetcher's note of each file's time, for the tooltips saying where a figure is from and how fresh. */
  fetched: Fetched | null
  /** A word under the headline while a data file could not be loaded. */
  warning: string | null
  /** Up a level: from a plant to the map, from an area to the system price. */
  onBack: () => void
  onSlot: (slot: number) => void
}

/**
 * The panel beside the map, about a scope: a picked plant, Okinawa, a picked area, a half of the grid chosen from its
 * control, or with nothing chosen the system. Its headline row stays pinned at the top while the view scrolls under it,
 * and the switches with it where the screen is tall enough. On a phone it is an accordion: the headline row alone until
 * tapped, remembered for what it was opened for, so another pick opens folded again.
 */
export default function Readout(props: Props) {
  const { slot, area, plant, warning, onBack } = props
  const s = useStrings()
  const view = useApp((x) => x.view)
  const half = useApp((x) => x.half)
  const narrow = useNarrow()
  const short = useShort()
  const [openFor, setOpenFor] = useState<string | null>(null)
  if (!slot) return null
  const scope = scopeOf(area, plant, half)
  const key = pickKey(scope)
  const open = !narrow || openFor === key
  const switches = scope.kind !== 'plant' && scope.kind !== 'okinawa' && <Switches halves={scope.kind !== 'area'} />
  const body =
    scope.kind === 'plant' ? (
      <p className="muted">{s.readout.plantNote}</p>
    ) : scope.kind === 'okinawa' ? (
      <SystemNote slot={slot} okinawa />
    ) : view === 'day' ? (
      <DayView
        scope={scope}
        spotDay={props.spotDay}
        totals={props.dayTotals}
        price={props.dayPrice}
        scoped={props.scoped}
        monthDays={props.monthDays}
        monthPrices={props.monthPrices}
        date={props.date}
        onDate={props.onDate}
      />
    ) : view === 'history' ? (
      <HistoryView
        scope={scope}
        history={props.history}
        splits={props.splits}
        date={props.date}
        slot={slot.slot}
        onDate={props.onDate}
        onSlot={props.onSlot}
      />
    ) : (
      <SlotView
        scope={scope}
        slot={slot}
        record={props.record}
        recordDay={props.recordDay}
        spotDay={props.spotDay}
        scoped={props.scoped}
        interchange={props.interchange}
        onSlot={props.onSlot}
      />
    )
  const head = <Headline scope={scope} slot={slot} />
  return (
    <aside className={styles.panel} aria-label={s.readout.label}>
      <div className={styles.pinned}>
        <div className={styles.head}>
          {(scope.kind === 'plant' || scope.kind === 'area') && (
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
        {warning && (
          <p className={styles.warning} role="alert">
            {warning}
          </p>
        )}
        {open && !short && switches}
      </div>
      {open && (
        <div className={styles.body}>
          {short && switches}
          <ProvenanceContext value={{ date: props.date, fetched: props.fetched }}>{body}</ProvenanceContext>
        </div>
      )}
    </aside>
  )
}
