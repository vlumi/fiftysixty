import { useStrings } from '../../i18n/useStrings'
import type { Area } from '../../regions/areas'
import { areaList } from '../../regions/names'
import { useApp } from '../../store'
import styles from './Readout.module.css'
import type { SummedScope } from './scope'

/** All Japan, or the chosen half, and the areas left out of its sums while their records are not in, by name. */
export default function ScopeHeading({ scope, missing }: { scope: SummedScope; missing: readonly Area[] }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  return (
    <h4>
      {scope.kind === 'half' ? s.readout.hz(scope.half) : s.day.japan}
      {missing.length > 0 && <span className={styles.without}> · {s.day.without(areaList(missing, lang))}</span>}
    </h4>
  )
}
