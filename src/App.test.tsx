import { render, screen } from '@testing-library/react'
import App from './App'
import { resetApp } from './store'
import csv from './test/fixtures/jepx-spot.csv?raw'

vi.mock('./map/MapView', () => ({ default: () => <div role="region" aria-label="Map" /> }))

beforeEach(() => {
  resetApp()
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('.csv')
          ? new Response(csv)
          : new Response(JSON.stringify({ type: 'FeatureCollection', features: [] })),
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

test('the page is the name, the line under it, the map, the clock and the price scale', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '50/60' })).toBeInTheDocument()
  expect(screen.getByText('The Japanese power market on a map')).toBeInTheDocument()
  expect(await screen.findByRole('region', { name: 'Map' })).toBeInTheDocument()
  expect(screen.getByRole('figure', { name: 'Price scale' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('12:00–12:30 JST')
})

test('the clock opens on the newest day the auction has priced', async () => {
  render(<App />)
  expect(await screen.findByDisplayValue('2026-09-26')).toBeInTheDocument()
})
