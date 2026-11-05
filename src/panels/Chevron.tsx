/** A chevron pointing down, turned clockwise by `turn` degrees, `size` pixels square. */
export default function Chevron({ turn = 0, size = 20 }: { turn?: number; size?: number }) {
  const [left, middle, right, top, tip] = [0.25, 0.5, 0.75, 0.375, 0.625].map((x) => x * size)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ transform: `rotate(${turn}deg)` }}
    >
      <path
        d={`M${left} ${top} ${middle} ${tip} ${right} ${top}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
