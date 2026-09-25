/** A price in yen per kWh to two decimals, as JEPX quotes it. */
export const yen = (price: number) => price.toFixed(2)

/** A difference with its sign, a real minus for the negative. */
export function signed(delta: number): string {
  const text = yen(Math.abs(delta))
  return delta < 0 ? `−${text}` : delta > 0 ? `+${text}` : `±${text}`
}
