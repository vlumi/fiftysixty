import type { RecordSlot } from '../market/record'
import { useStrings } from '../i18n/useStrings'
import { SERIES, stackDay } from '../market/stack'
import styles from './MixGlyph.module.css'

const WIDTH = 18
const MW_PER_PX = 500
const GW = 1000
/** Below this scale the figure under the column would be too small to read, so it is left off. */
const LABEL_FROM = 0.6
/** The empty column's height, about a 10 GW demand, where an area has no record. */
const EMPTY_HEIGHT = 20

interface Props {
  name: string
  /** Null where the area has no record for the slot: an empty column stands in, so the gap does not read as a fault. */
  record: RecordSlot | null
  /** The column's size against full size, following the map's zoom. */
  scale?: number
  onPick: () => void
}

/** What ran in an area for the slot, as a column in the middle of it on the map: the chart's bands, a hatched cap for curtailment, demand as its height. */
export default function MixGlyph({ name, record, scale = 1, onPick }: Props) {
  const s = useStrings()
  const width = WIDTH * scale
  if (!record) {
    const height = EMPTY_HEIGHT * scale
    return (
      <button className={styles.glyph} aria-label={`${s.key.mix(name)}, ${s.key.noData}`} onClick={onPick}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <rect className={styles.empty} x={0.5} y={0.5} width={width - 1} height={height - 1} />
        </svg>
        {scale >= LABEL_FROM && <span className={`${styles.label} ${styles.muted}`}>{s.key.noData}</span>}
      </button>
    )
  }
  const [at] = stackDay([record]).slots
  // A source reported negative for a half hour would give a band a negative height, which SVG drops.
  const px = (mw: number) => (Math.max(0, mw) / MW_PER_PX) * scale
  const imports = Math.max(0, at.exchangeMW)
  const exports = Math.max(0, -at.exchangeMW)
  const top = px(at.generatedMW + imports + at.curtailedMW)
  const height = top + px(exports)
  const y = (mw: number) => top - px(mw)
  return (
    <button className={styles.glyph} aria-label={s.key.mix(name)} onClick={onPick}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {SERIES.map((s) => (
          <rect
            key={s}
            x={0}
            width={width}
            y={y(at.bands[s].from + at.bands[s].value)}
            height={px(at.bands[s].value)}
            style={{ fill: `var(--src-${s})` }}
          />
        ))}
        <rect className={styles.exchange} x={0} width={width} y={y(at.generatedMW + imports)} height={px(imports)} />
        <rect
          className={styles.curtailed}
          x={0}
          width={width}
          y={y(at.generatedMW + imports + at.curtailedMW)}
          height={px(at.curtailedMW)}
        />
        <rect className={styles.exchange} x={0} width={width} y={top} height={px(exports)} />
        <line className={styles.baseline} x1={-3 * scale} x2={width + 3 * scale} y1={top} y2={top} />
      </svg>
      {scale >= LABEL_FROM && (
        <span className={styles.label}>
          {(at.demandMW / GW).toFixed(1)} {s.chart.gw}
        </span>
      )}
    </button>
  )
}
