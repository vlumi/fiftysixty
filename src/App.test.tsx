import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./map/MapView', () => ({ default: () => <div role="region" aria-label="Map" /> }))

test('the page is the name, the line under it, and the map', async () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '50/60' })).toBeInTheDocument()
  expect(screen.getByText('The Japanese power market on a map')).toBeInTheDocument()
  expect(await screen.findByRole('region', { name: 'Map' })).toBeInTheDocument()
})
