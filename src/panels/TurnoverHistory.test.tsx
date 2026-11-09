import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { priceHistory } from '../market/history'
import { parseSpot } from '../market/jepx'
import { resetApp, useApp } from '../store'
import TurnoverHistory from './TurnoverHistory'

const days = priceHistory(parseSpot(csv))

afterEach(() => {
  localStorage.clear()
  resetApp()
})

test('a column a day up to a round top, the displayed day marked with its figure in the key, and a press picking a day', () => {
  const onPick = vi.fn()
  const { container } = render(<TurnoverHistory days={days} date="2026-09-23" onPick={onPick} />)
  const figure = screen.getByRole('slider', { name: 'Turnover history' })
  const billions = (days[1].turnover / 1e9).toFixed(2)
  expect(figure).toHaveAttribute('aria-valuenow', '2')
  expect(figure).toHaveAttribute('aria-valuetext', `2026-09-23 (Wed): ${billions} ¥ bn`)
  expect(figure.querySelector('path')!.getAttribute('d')).toMatch(/^M0,1(V0\.\d{4}H\d){4}V1Z$/)
  expect((figure.querySelector('span') as HTMLElement).style.left).toBe('37.5%')
  const most = Math.max(...days.map((d) => d.turnover)) / 1e9
  const [top, zero] = [...container.querySelectorAll('[aria-hidden] span')].map((x) => x.textContent)
  expect(Number(top)).toBeGreaterThanOrEqual(most)
  expect(Number(top)).toBeLessThan(most * 2)
  expect(zero).toBe('0')
  expect(container.querySelector('figcaption')).toHaveTextContent(`Turnover a day, ¥ bn${billions}`)
  figure.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 48 }) as DOMRect
  figure.setPointerCapture = vi.fn()
  fireEvent.pointerDown(figure, { clientX: 190, clientY: 10, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-26')
})

test('in Japanese the figures are in 億円', () => {
  useApp.setState({ lang: 'ja' })
  render(<TurnoverHistory days={days} date="2026-09-22" onPick={vi.fn()} />)
  expect(screen.getByRole('slider', { name: '約定金額の推移' })).toHaveAttribute(
    'aria-valuetext',
    expect.stringContaining(`${(days[0].turnover / 1e8).toFixed(1)} 億円`),
  )
})

test('nothing without a day', () => {
  const { container } = render(<TurnoverHistory days={[]} date={null} onPick={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
