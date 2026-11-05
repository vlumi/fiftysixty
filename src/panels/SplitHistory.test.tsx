import { render, screen } from '@testing-library/react'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot } from '../market/jepx'
import { scopeLines, splitHistory } from '../market/splits'
import { resetApp, useApp } from '../store'
import SplitHistory from './SplitHistory'

const spot = parseSpot(csv)

afterEach(resetApp)

test('a line a row named by its ends, the displayed day marked, and the key from none to all of the half hours', () => {
  const { container } = render(
    <SplitHistory splits={splitHistory(spot, scopeLines('kansai', null))} date="2026-09-23" />,
  )
  const figure = screen.getByRole('img', { name: 'Market splits' })
  expect([...container.querySelectorAll('[aria-hidden] span')].slice(0, 4).map((x) => x.textContent)).toEqual([
    'Chubu–Kansai',
    'Hokuriku–Kansai',
    'Kansai–Chugoku',
    'Kansai–Shikoku',
  ])
  expect((figure.querySelector('span') as HTMLElement).style.left).toBe('37.5%')
  expect(container.querySelector('figcaption')).toHaveTextContent('Half hours the line split, share of the day0%100%')
})

test('in Japanese the ends are named in Japanese', () => {
  useApp.setState({ lang: 'ja' })
  render(<SplitHistory splits={splitHistory(spot, scopeLines(null, 50))} date={null} />)
  expect(screen.getByRole('img', { name: '市場分断の推移' })).toBeInTheDocument()
  expect(screen.getByText('東京–中部')).toBeInTheDocument()
})

test('nothing without a line or a day', () => {
  const { container } = render(<SplitHistory splits={splitHistory(spot, scopeLines('okinawa', null))} date={null} />)
  expect(container).toBeEmptyDOMElement()
})
