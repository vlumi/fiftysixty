import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fixture from '../test/fixtures/plants.geojson?raw'
import type { Plants } from '../regions/plants'
import LayersPanel from './Layers'

const plants = JSON.parse(fixture) as Plants

const on = { flows: true, mixes: true, plants: true }

test('a switch a layer, the plants filter under theirs only while they show', async () => {
  const onToggleLayer = vi.fn()
  const { rerender } = render(
    <LayersPanel
      layers={{ ...on, plants: false }}
      onToggleLayer={onToggleLayer}
      plants={plants}
      hiddenFuels={[]}
      onToggle={vi.fn()}
      onHide={vi.fn()}
    />,
  )
  expect(screen.getByRole('switch', { name: 'Flows' })).toBeChecked()
  expect(screen.getByRole('switch', { name: 'Plants' })).not.toBeChecked()
  expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('switch', { name: 'Plants' }))
  expect(onToggleLayer).toHaveBeenCalledWith('plants')
  rerender(
    <LayersPanel
      layers={on}
      onToggleLayer={onToggleLayer}
      plants={plants}
      hiddenFuels={[]}
      onToggle={vi.fn()}
      onHide={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
})

test('a row a fuel with its count, pressed when shown; All and None', async () => {
  const onToggle = vi.fn()
  const onHide = vi.fn()
  render(
    <LayersPanel
      layers={on}
      onToggleLayer={vi.fn()}
      plants={plants}
      hiddenFuels={['coal']}
      onToggle={onToggle}
      onHide={onHide}
    />,
  )
  expect(screen.getByRole('button', { name: 'Coal, 1 plant' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Hydro, 1 plant' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Gas, 0 plants' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Hydro, 1 plant' }))
  expect(onToggle).toHaveBeenCalledWith('hydro')
  await userEvent.click(screen.getByRole('button', { name: 'All' }))
  expect(onHide).toHaveBeenLastCalledWith([])
  await userEvent.click(screen.getByRole('button', { name: 'None' }))
  expect(onHide.mock.lastCall![0]).toHaveLength(8)
})

test('All is spent when every fuel shows, None when none does', () => {
  const { rerender } = render(
    <LayersPanel
      layers={on}
      onToggleLayer={vi.fn()}
      plants={null}
      hiddenFuels={[]}
      onToggle={vi.fn()}
      onHide={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'All' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'None' })).toBeEnabled()
  rerender(
    <LayersPanel
      layers={on}
      onToggleLayer={vi.fn()}
      plants={null}
      hiddenFuels={['coal', 'nuclear', 'renewables', 'otherThermal', 'solar', 'wind', 'gas', 'hydro']}
      onToggle={vi.fn()}
      onHide={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'None' })).toBeDisabled()
})
