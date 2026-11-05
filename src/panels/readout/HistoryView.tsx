import { useStrings } from '../../i18n/useStrings'
import type { HistoryDay } from '../../market/history'
import PriceHistory from '../PriceHistory'
import type { PricedScope } from './scope'

interface Props {
  scope: PricedScope
  history: readonly HistoryDay[]
  date: string | null
  slot: number
  onDate: (date: string) => void
  onSlot: (slot: number) => void
}

/** The price history as the heatmap: the picked area's price, or the system's for a half, which has none of its own, and for all Japan. */
export default function HistoryView({ scope, history, date, slot, onDate, onSlot }: Props) {
  const s = useStrings()
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
    </>
  )
}
