import type { RecordSlot } from '../market/record'
import { useStrings } from '../i18n/useStrings'
import { SERIES, stackDay } from '../market/stack'
import styles from './MixGlyph.module.css'

const WIDTH = 18
const MW_PER_PX = 500
const GW = 1000

interface Props {
  name: string
  record: RecordSlot
  onPick: () => void
}

/** What ran in an area for the slot, as a column in the middle of it on the map: the chart's bands, a hatched cap for curtailment, demand as its height. */
export default function MixGlyph({ name, record, onPick }: Props) {
  const s = useStrings()
  const [at] = stackDay([record]).slots
  const px = (mw: number) => mw / MW_PER_PX
  const imports = Math.max(0, at.exchangeMW)
  const exports = Math.max(0, -at.exchangeMW)
  const top = px(at.generatedMW + imports + at.curtailedMW)
  const height = top + px(exports)
  const y = (mw: number) => top - px(mw)
  return (
    <button className={styles.glyph} aria-label={s.key.mix(name)} onClick={onPick}>
      <svg width={WIDTH} height={height} viewBox={`0 0 ${WIDTH} ${height}`}>
        {SERIES.map((s) => (
          <rect
            key={s}
            x={0}
            width={WIDTH}
            y={y(at.bands[s].from + at.bands[s].value)}
            height={px(at.bands[s].value)}
            style={{ fill: `var(--src-${s})` }}
          />
        ))}
        <rect className={styles.exchange} x={0} width={WIDTH} y={y(at.generatedMW + imports)} height={px(imports)} />
        <rect
          className={styles.curtailed}
          x={0}
          width={WIDTH}
          y={y(at.generatedMW + imports + at.curtailedMW)}
          height={px(at.curtailedMW)}
        />
        <rect className={styles.exchange} x={0} width={WIDTH} y={top} height={px(exports)} />
        <line className={styles.baseline} x1={-3} x2={WIDTH + 3} y1={top} y2={top} />
      </svg>
      <span className={styles.label}>
        {(at.demandMW / GW).toFixed(1)} {s.chart.gw}
      </span>
    </button>
  )
}
