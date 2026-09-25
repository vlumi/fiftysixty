import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import csv from '../test/fixtures/jepx-spot.csv?raw'
import { parseSpot, slotOf } from '../market/jepx'
import Readout from './Readout'

const slot = slotOf(parseSpot(csv), '2026-09-26', 47)!

test('without an area, the system price and the range across the areas', () => {
  render(<Readout slot={slot} area={null} onClose={vi.fn()} />)
  expect(screen.getByRole('heading', { name: 'System price' })).toBeInTheDocument()
  expect(screen.getByText('14.12')).toBeInTheDocument()
  expect(screen.getByText(/Areas from 10.04 to 22.02/)).toBeInTheDocument()
})

test('a picked area against the system price and its neighbors', async () => {
  const onClose = vi.fn()
  render(<Readout slot={slot} area="tokyo" onClose={onClose} />)
  expect(screen.getByRole('heading', { name: 'Tokyo 50 Hz' })).toBeInTheDocument()
  expect(screen.getByText('22.02', { selector: 'p' })).toBeInTheDocument()
  const rows = screen.getAllByRole('definition').map((d) => d.textContent)
  expect(rows).toEqual(['14.12 −7.90', '10.45 −11.57', '22.02 ±0.00'])
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

test('Okinawa has no price to show', () => {
  render(<Readout slot={slot} area="okinawa" onClose={vi.fn()} />)
  expect(screen.getByText(/Okinawa is not on the exchange/)).toBeInTheDocument()
})

test('nothing before the prices arrive', () => {
  const { container } = render(<Readout slot={undefined} area={null} onClose={vi.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
