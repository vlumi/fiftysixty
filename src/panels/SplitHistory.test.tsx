import { fireEvent, render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import { scopeLines, splitHistory } from '../market/splits'
import { resetApp, useApp } from '../store'
import SplitHistory from './SplitHistory'

const spot = parseSpot(csv)

afterEach(resetApp)

test('a line a row named by its ends, the displayed day marked and read out, a press picking a day, and the key from none to all', () => {
  const onPick = vi.fn()
  const { container } = render(
    <SplitHistory splits={splitHistory(spot, scopeLines('kansai', null))} date="2026-09-23" onPick={onPick} />,
  )
  const figure = screen.getByRole('slider', { name: 'Market splits' })
  expect([...container.querySelectorAll('[aria-hidden] span')].slice(0, 4).map((x) => x.textContent)).toEqual([
    'Chubu–Kansai',
    'Hokuriku–Kansai',
    'Kansai–Chugoku',
    'Kansai–Shikoku',
  ])
  expect(figure).toHaveAttribute('aria-valuenow', '2')
  expect(figure).toHaveAttribute(
    'aria-valuetext',
    '2026-09-23 (Wed): Chubu–Kansai 100%, Hokuriku–Kansai 13%, Kansai–Chugoku 27%, Kansai–Shikoku 27%',
  )
  expect((figure.querySelector('span') as HTMLElement).style.left).toBe('37.5%')
  figure.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 32 }) as DOMRect
  figure.setPointerCapture = vi.fn()
  fireEvent.pointerDown(figure, { clientX: 190, clientY: 10, pointerId: 1 })
  expect(onPick).toHaveBeenLastCalledWith('2026-09-26')
  expect(container.querySelector('figcaption')).toHaveTextContent('Half hours the line split, share of the day0%100%')
})

test('in Japanese the ends are named in Japanese', () => {
  useApp.setState({ lang: 'ja' })
  render(<SplitHistory splits={splitHistory(spot, scopeLines(null, 50))} date={null} onPick={vi.fn()} />)
  expect(screen.getByRole('slider', { name: '市場分断の推移' })).toBeInTheDocument()
  expect(screen.getByText('東京–中部')).toBeInTheDocument()
})

test('nothing without a line or a day', () => {
  const { container } = render(
    <SplitHistory splits={splitHistory(spot, scopeLines('okinawa', null))} date={null} onPick={vi.fn()} />,
  )
  expect(container).toBeEmptyDOMElement()
})
