import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Legend from './Legend'

afterEach(() => vi.unstubAllGlobals())

test('the key is open by default on a wide screen, with the ramp, the arrows and the eight fuels, and folds away', async () => {
  render(<Legend hiddenFuels={[]} onToggleFuel={vi.fn()} plantsShown={true} />)
  const key = screen.getByRole('figure', { name: 'Key' })
  expect(key).toHaveTextContent('50+ ¥/kWh')
  expect(key).toHaveTextContent('split')
  expect(key).toHaveTextContent('Nuclear')
  expect(key.querySelectorAll('svg')).toHaveLength(3)
  await userEvent.click(screen.getByRole('button', { name: 'Key' }))
  expect(screen.queryByRole('figure', { name: 'Key' })).not.toBeInTheDocument()
})

test('on a phone the key is folded until asked for', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<Legend hiddenFuels={[]} onToggleFuel={vi.fn()} plantsShown={true} />)
  expect(screen.queryByRole('figure', { name: 'Key' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Key' }))
  expect(screen.getByRole('figure', { name: 'Key' })).toBeInTheDocument()
})

test('the fuel swatches are the plants filter: pressed shows, a tap toggles, and far out the key says to zoom in', async () => {
  const onToggleFuel = vi.fn()
  render(<Legend hiddenFuels={['coal']} onToggleFuel={onToggleFuel} plantsShown={false} />)
  expect(screen.getByRole('button', { name: 'Coal' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Gas' })).toHaveAttribute('aria-pressed', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'Gas' }))
  expect(onToggleFuel).toHaveBeenCalledWith('gas')
  expect(screen.getByText('plants: zoom in')).toBeInTheDocument()
})
