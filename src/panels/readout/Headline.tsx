import { useStrings } from '../../i18n/useStrings'
import { slotSpread, type SpotSlot } from '../../market/jepx'
import { AREA_BY_ID, areasOf, type Hz, type PricedArea } from '../../regions/areas'
import { areaName } from '../../regions/names'
import type { PlantProps } from '../../regions/plants'
import { mw, yen } from '../../shared/format'
import { useApp } from '../../store'
import styles from './Readout.module.css'
import type { Scope } from './scope'

/** The scope's name and its price for the half hour: a plant's capacity in place of a price, and a half's spread. */
export default function Headline({ scope, slot }: { scope: Scope; slot: SpotSlot }) {
  switch (scope.kind) {
    case 'plant':
      return <PlantHead plant={scope.plant} />
    case 'area':
      return <AreaHead area={scope.area} slot={slot} />
    case 'half':
      return <HalfHead half={scope.half} slot={slot} />
    default:
      return <SystemHead slot={slot} />
  }
}

function PlantHead({ plant }: { plant: PlantProps }) {
  const s = useStrings()
  return (
    <>
      <h2>{plant.name || s.readout.aPlant}</h2>
      <p className={styles.price}>
        {mw(plant.mw)} <span className="muted">{s.readout.mw}</span>{' '}
        <span className={`${styles.pill} ${styles[plant.fuel]}`}>{s.chart.series[plant.fuel]}</span>
      </p>
    </>
  )
}

function SystemHead({ slot }: { slot: SpotSlot }) {
  const s = useStrings()
  return (
    <>
      <h2>{s.readout.systemPrice}</h2>
      <p className={styles.price}>
        {yen(slot.systemPrice)} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
  )
}

/** A half of the grid as the headline: its areas' price when they agree, else the spread across them. */
function HalfHead({ half, slot }: { half: Hz; slot: SpotSlot }) {
  const s = useStrings()
  const [low, high] = slotSpread(slot, areasOf(half))
  return (
    <>
      <h2 className={styles[`hz${half}`]}>{s.readout.hz(half)}</h2>
      <p className={styles.price}>
        {low === high ? yen(low) : `${yen(low)}–${yen(high)}`} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
  )
}

function AreaHead({ area, slot }: { area: PricedArea; slot: SpotSlot }) {
  const s = useStrings()
  const lang = useApp((x) => x.lang)
  return (
    <>
      <h2>
        {areaName(area, lang)} <span className="muted">{s.readout.hz(AREA_BY_ID[area].hz)}</span>
      </h2>
      <p className={styles.price}>
        {yen(slot.areaPrice[area])} <span className="muted">{s.readout.yenPerKwh}</span>
      </p>
    </>
  )
}
