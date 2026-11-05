import { useStrings } from '../../i18n/useStrings'
import type { HistoryDay } from '../../market/history'
import type { SplitHistory as Splits } from '../../market/splits'
import DurationCurve from '../DurationCurve'
import PriceHistory from '../PriceHistory'
import SplitHistory from '../SplitHistory'
import type { PricedScope } from './scope'

interface Props {
  scope: PricedScope
  history: readonly HistoryDay[]
  /** The scope's lines over the same days, for the splits under the prices. */
  splits: Splits
  date: string | null
  slot: number
  onDate: (date: string) => void
  onSlot: (slot: number) => void
}

/**
 * The long view: the price history as the heatmap, the picked area's price, or the system's for a half, which has
 * none of its own, and for all Japan; under it the market splits over the same days on the scope's lines, and the
 * price duration curve over every half hour of them.
 */
export default function HistoryView({ scope, history, splits, date, slot, onDate, onSlot }: Props) {
  const s = useStrings()
  const at = date ? history.findIndex((d) => d.date === date) : -1
  const price = at >= 0 ? history[at].prices[slot - 1] : NaN
  return (
    <>
      {scope.kind === 'half' && <p className="muted">{s.readout.halfHistory}</p>}
      <PriceHistory
        days={history}
        area={scope.kind === 'area' ? scope.area : null}
        date={date}
        slot={slot}
        onPick={(d, at) => {
          if (d !== date) onDate(d)
          onSlot(at)
        }}
      />
      <SplitHistory splits={splits} date={date} />
      <DurationCurve days={history} scope={scope} price={price} />
    </>
  )
}
