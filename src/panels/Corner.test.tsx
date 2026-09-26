import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DARK } from '../shared/palette'
import Corner from './Corner'

afterEach(() => vi.unstubAllGlobals())

const props = {
  palette: DARK,
  plants: null,
  hiddenFuels: [],
  onToggleFuel: vi.fn(),
  onHideFuels: vi.fn(),
  plantsShown: true,
}

test('the key is open by default on a wide screen; Plants takes its place and Key folds it away', async () => {
  render(<Corner {...props} />)
  expect(screen.getByRole('figure', { name: 'Key' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Plants' }))
  expect(screen.queryByRole('figure', { name: 'Key' })).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Plants' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Plants' }))
  expect(screen.queryByRole('region', { name: 'Plants' })).not.toBeInTheDocument()
})

test('on a phone both start folded', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<Corner {...props} />)
  expect(screen.queryByRole('figure', { name: 'Key' })).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Plants' })).not.toBeInTheDocument()
})

test('an open panel has a close button of its own', async () => {
  render(<Corner {...props} />)
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('figure', { name: 'Key' })).not.toBeInTheDocument()
})
