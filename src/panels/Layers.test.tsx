import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fixture from '../test/fixtures/plants.geojson?raw'
import type { Plants } from '../regions/plants'
import { SERIES } from '../market/stack'
import LayersPanel from './Layers'

const plants = JSON.parse(fixture) as Plants
const on = { flows: true, mixes: true }

test('a box a layer; the plants box is off with every fuel hidden, on with none, half with some, and flips between all and none', async () => {
  const onToggleLayer = vi.fn()
  const onHide = vi.fn()
  const { rerender } = render(
    <LayersPanel
      layers={{ ...on, flows: false }}
      onToggleLayer={onToggleLayer}
      plants={plants}
      hiddenFuels={[...SERIES]}
      onToggle={vi.fn()}
      onHide={onHide}
    />,
  )
  expect(screen.getByRole('checkbox', { name: 'Flows' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Mix columns' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Plants' })).not.toBeChecked()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Flows' }))
  expect(onToggleLayer).toHaveBeenCalledWith('flows')
  await userEvent.click(screen.getByRole('checkbox', { name: 'Plants' }))
  expect(onHide).toHaveBeenLastCalledWith([])
  const filtered = (hidden: (typeof SERIES)[number][]) => (
    <LayersPanel
      layers={on}
      onToggleLayer={vi.fn()}
      plants={plants}
      hiddenFuels={hidden}
      onToggle={vi.fn()}
      onHide={onHide}
    />
  )
  rerender(filtered(['coal']))
  expect(screen.getByRole('checkbox', { name: 'Plants' })).toBePartiallyChecked()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Plants' }))
  expect(onHide).toHaveBeenLastCalledWith([])
  rerender(filtered([]))
  expect(screen.getByRole('checkbox', { name: 'Plants' })).toBeChecked()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Plants' }))
  expect(onHide.mock.lastCall![0]).toHaveLength(8)
})

test('the fuels open on the chevron: a row a fuel with its count, pressed when shown', async () => {
  const onToggle = vi.fn()
  render(
    <LayersPanel
      layers={on}
      onToggleLayer={vi.fn()}
      plants={plants}
      hiddenFuels={['coal']}
      onToggle={onToggle}
      onHide={vi.fn()}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Coal, 1 plant' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'By fuel', expanded: false }))
  expect(screen.getByRole('button', { name: 'Coal, 1 plant' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Hydro, 1 plant' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Gas, 0 plants' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Hydro, 1 plant' }))
  expect(onToggle).toHaveBeenCalledWith('hydro')
  await userEvent.click(screen.getByRole('button', { name: 'By fuel', expanded: true }))
  expect(screen.queryByRole('button', { name: 'Coal, 1 plant' })).not.toBeInTheDocument()
})
