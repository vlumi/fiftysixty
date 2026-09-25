import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fixture from '../test/fixtures/plants.geojson?raw'
import type { Plants } from '../regions/plants'
import PlantsPanel from './Plants'

const plants = JSON.parse(fixture) as Plants

test('a row a fuel with its count, pressed when shown; All and None; a hint far out', async () => {
  const onToggle = vi.fn()
  const onHide = vi.fn()
  render(<PlantsPanel plants={plants} hiddenFuels={['coal']} onToggle={onToggle} onHide={onHide} shown={false} />)
  expect(screen.getByRole('button', { name: 'Coal, 1 plant' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Hydro, 1 plant' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Gas, 0 plants' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Hydro, 1 plant' }))
  expect(onToggle).toHaveBeenCalledWith('hydro')
  await userEvent.click(screen.getByRole('button', { name: 'All' }))
  expect(onHide).toHaveBeenLastCalledWith([])
  await userEvent.click(screen.getByRole('button', { name: 'None' }))
  expect(onHide.mock.lastCall![0]).toHaveLength(8)
  expect(screen.getByText('zoom in to see them')).toBeInTheDocument()
})

test('All is spent when every fuel shows, None when none does', () => {
  const { rerender } = render(<PlantsPanel plants={null} hiddenFuels={[]} onToggle={vi.fn()} onHide={vi.fn()} shown />)
  expect(screen.getByRole('button', { name: 'All' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'None' })).toBeEnabled()
  rerender(
    <PlantsPanel
      plants={null}
      hiddenFuels={['coal', 'nuclear', 'renewables', 'otherThermal', 'solar', 'wind', 'gas', 'hydro']}
      onToggle={vi.fn()}
      onHide={vi.fn()}
      shown
    />,
  )
  expect(screen.getByRole('button', { name: 'None' })).toBeDisabled()
})
