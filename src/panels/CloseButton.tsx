import { useStrings } from '../i18n/useStrings'
import styles from './CloseButton.module.css'

/** The × in a panel's top-right corner, one size and look wherever a panel can be closed. */
export default function CloseButton({ onClick }: { onClick: () => void }) {
  const s = useStrings()
  return (
    <button className={styles.close} aria-label={s.close} onClick={onClick}>
      ×
    </button>
  )
}
