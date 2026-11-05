const thousandth = (x: number) =>
  (x / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Megawatt hours as gigawatt hours to one decimal. */
export const gwh = (mwh: number) => thousandth(mwh)

/** Tonnes as kilotonnes to one decimal. */
export const kt = (tonnes: number) => thousandth(tonnes)

/** A share of one as a whole percentage. */
export const percent = (share: number) => `${Math.round(share * 100)}%`

/** A price in yen per kWh to two decimals, as JEPX quotes it. */
export const yen = (price: number) => price.toFixed(2)

/** A difference with its sign, a real minus for the negative. */
export function signed(delta: number): string {
  const text = yen(Math.abs(delta))
  return delta < 0 ? `−${text}` : delta > 0 ? `+${text}` : `±${text}`
}

/** Megawatts as a whole number with thousands separators, the sign kept for pumping, charging and exports. */
export const mw = (value: number) => Math.round(value).toLocaleString('en-US').replace('-', '−')
