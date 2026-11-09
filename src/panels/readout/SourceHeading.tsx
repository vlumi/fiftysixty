import { useStrings } from '../../i18n/useStrings'
import { companyShort } from '../../regions/companies'
import { useApp } from '../../store'
import styles from './Readout.module.css'
import type { SourceGroup } from './scope'

/**
 * A header over a group of the readout's rows naming who published them and, muted, what kind of number they are:
 * contract prices, actuals, a plan never revised to what happened, or computed here from the rest.
 * In small caps on one line, the tail dropping to a second only where the panel is too narrow for both.
 */
export default function SourceHeading({ source }: { source: SourceGroup }) {
  const s = useStrings().readout.source
  const lang = useApp((x) => x.lang)
  const [name, when] =
    source.kind === 'jepx'
      ? [s.jepx, s.jepxWhen]
      : source.kind === 'record'
        ? [source.area ? s.record(companyShort(source.area, lang)) : s.records, s.recordWhen]
        : source.kind === 'occto'
          ? [s.occto, s.occtoWhen]
          : [s.derived, s.derivedWhen]
  return (
    <h3 className={styles.source}>
      <span>{name}</span> <span className="muted">· {when}</span>
    </h3>
  )
}
