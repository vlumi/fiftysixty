import { Fragment, useEffect, useRef } from 'react'
import { useStrings } from '../i18n/useStrings'
import type { Fetched } from '../market/fetched'
import { latestFetch, type Publisher } from '../market/sources'
import { SHORTCUTS } from '../shortcuts'
import { jstDateTime } from '../time/days'
import CloseButton from './CloseButton'
import styles from './Credits.module.css'

/**
 * What the page is and where the map, the shapes and the figures come from, behind the header's ⓘ, the map's own
 * attribution being off; how fresh each publisher's data is, from the fetcher's note of its files; and a table of what
 * kind of number each figure is and when its publisher speaks against the delivery day.
 */
export default function Credits({ fetched = null, onClose }: { fetched?: Fetched | null; onClose: () => void }) {
  const s = useStrings()
  const updated = (publisher: Publisher) => {
    const at = latestFetch(fetched, publisher)
    return at && <span className={styles.updated}>{s.credits.updated(jstDateTime(new Date(at)))}</span>
  }
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Focus moves into the dialog and back to what opened it; Tab cycles within it.
    const opener = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    return () => opener?.focus()
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !dialog.current) return
      const stops = [...dialog.current.querySelectorAll<HTMLElement>('a[href], button')]
      if (!stops.length) return
      const [first, last] = [stops[0], stops[stops.length - 1]]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === dialog.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    // The page must not scroll under the modal, as a phone would let it.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credits-title"
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={onClose} />
        <h2 id="credits-title">{s.credits.title}</h2>
        <p className={styles.about}>{s.credits.about}</p>
        <h3>{s.credits.credits}</h3>
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
            {updated('jepx')}
          </dd>
          <dt>{s.credits.records}</dt>
          <dd>
            {s.credits.recordsBy}
            {updated('record')}
          </dd>
          <dt>{s.credits.lines}</dt>
          <dd>
            <a href="https://web-kohyo.occto.or.jp/kks-web-public/">OCCTO</a>
            {updated('occto')}
          </dd>
          <dt>{s.credits.co2}</dt>
          <dd>{s.credits.co2By}</dd>
        </dl>
        {fetched && <p className={styles.note}>{s.credits.hourly}</p>}
        <h3>{s.credits.sources}</h3>
        <table className={styles.sources}>
          <thead>
            <tr>
              <th scope="col">{s.credits.figure}</th>
              <th scope="col">{s.credits.publisher}</th>
              <th scope="col">{s.credits.kind}</th>
              <th scope="col">{s.credits.when}</th>
            </tr>
          </thead>
          <tbody>
            {(['jepx', 'record', 'occto', 'derived'] as const).map((row) => (
              <tr key={row}>
                <th scope="row">{s.credits.table[row].figure}</th>
                <td>{s.credits.table[row].publisher}</td>
                <td>{s.credits.table[row].kind}</td>
                <td>{s.credits.table[row].when}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>{s.help.title}</h3>
        <dl className={styles.rows}>
          {SHORTCUTS.map(({ keys, does }) => (
            <Fragment key={keys}>
              <dt>
                <kbd>{keys}</kbd>
              </dt>
              <dd>{s.help[does]}</dd>
            </Fragment>
          ))}
        </dl>
        <p className={styles.source}>
          <a href="https://github.com/vlumi/fiftysixty">{s.credits.source}</a>
        </p>
      </div>
    </div>
  )
}
