import { useEffect } from 'react'
import { useStrings } from '../i18n/useStrings'
import styles from './Credits.module.css'

/** Where the map, the shapes and the figures come from, behind the header's ⓘ; the map's own attribution is off. */
export default function Credits({ onClose }: { onClose: () => void }) {
  const s = useStrings()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} aria-label={s.close} onClick={onClose}>
          ×
        </button>
        <h2 id="credits-title">{s.credits.title}</h2>
        <dl className={styles.rows}>
          <dt>{s.credits.map}</dt>
          <dd>
            <a href="https://openfreemap.org">OpenFreeMap</a> <a href="https://www.openmaptiles.org/">© OpenMapTiles</a>{' '}
            <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
          </dd>
          <dt>{s.credits.regions}</dt>
          <dd>
            <a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html">地球地図日本</a> (GSI) via{' '}
            <a href="https://github.com/dataofjapan/land">dataofjapan/land</a>
          </dd>
          <dt>{s.credits.plants}</dt>
          <dd>
            <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
          </dd>
          <dt>{s.credits.prices}</dt>
          <dd>
            <a href="https://www.jepx.jp/electricpower/market-data/spot/">JEPX</a>
          </dd>
          <dt>{s.credits.records}</dt>
          <dd>{s.credits.recordsBy}</dd>
          <dt>{s.credits.lines}</dt>
          <dd>
            <a href="https://web-kohyo.occto.or.jp/kks-web-public/">OCCTO</a>
          </dd>
        </dl>
        <p className={styles.source}>
          <a href="https://github.com/vlumi/fiftysixty">{s.credits.source}</a>
        </p>
      </div>
    </div>
  )
}
