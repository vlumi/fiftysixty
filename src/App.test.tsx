import { act, render, screen } from '@testing-library/react'
import App from './App'
import { resetApp } from './store'
import csv from './test/fixtures/jepx-spot.csv?raw'

vi.mock('./map/MapView', () => ({ default: () => <div role="region" aria-label="Map" /> }))

beforeEach(() => {
  resetApp()
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-26T10:00:00+09:00') })
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('jepx-spot-2026.csv')
          ? new Response(csv)
          : url.endsWith('.csv') || url.endsWith('plants.geojson')
            ? new Response('', { status: 404 })
            : new Response(JSON.stringify({ type: 'FeatureCollection', features: [] })),
      ),
    ),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('the page is the name, the line under it, the map, the clock and the price scale', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '50/60' })).toBeInTheDocument()
  expect(screen.getByText('The Japanese power market on a map')).toBeInTheDocument()
  expect(await screen.findByRole('region', { name: 'Map' })).toBeInTheDocument()
  expect(screen.getByRole('figure', { name: 'Key' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('12:00–12:30 JST')
})

test('the clock opens on yesterday in Japan, the newest complete day, with the system price read out', async () => {
  render(<App />)
  expect(await screen.findByDisplayValue('2026-09-25')).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: 'Readout' })).toHaveTextContent('System price')
})

test('play runs the half hours on', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'], now: new Date('2026-09-26T10:00:00+09:00') })
  render(<App />)
  expect(await screen.findByDisplayValue('2026-09-25')).toBeInTheDocument()
  act(() => screen.getByRole('button', { name: 'Play' }).click())
  act(() => vi.advanceTimersByTime(1000))
  expect(screen.getByRole('status')).toHaveTextContent('14:00–14:30 JST')
})

test('the theme follows the system until chosen, the choice on the document and kept', async () => {
  render(<App />)
  expect(document.documentElement.dataset.theme).toBe('dark')
  act(() => screen.getByRole('button', { name: 'Switch to the light theme' }).click())
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem('fiftysixty.theme')).toBe('light')
  localStorage.clear()
})

test('Japanese is a click away: the words, the areas and the document follow, and the choice is kept', async () => {
  render(<App />)
  expect(await screen.findByDisplayValue('2026-09-25')).toBeInTheDocument()
  act(() => screen.getByRole('button', { name: 'Language' }).click())
  expect(document.documentElement.lang).toBe('ja')
  expect(screen.getByText('地図で見る日本の電力市場')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('昨日 12:00–12:30 JST')
  expect(localStorage.getItem('fiftysixty.lang')).toBe('ja')
  act(() => screen.getByRole('button', { name: '言語' }).click())
  localStorage.clear()
})
