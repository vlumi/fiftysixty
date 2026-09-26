import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Credits from './Credits'

test('the credits name every source and close on the button, the backdrop and Escape', async () => {
  const onClose = vi.fn()
  render(<Credits onClose={onClose} />)
  expect(screen.getByRole('dialog', { name: 'Credits' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'OpenFreeMap' })).toHaveAttribute('href', 'https://openfreemap.org')
  expect(screen.getByRole('link', { name: 'JEPX' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'OCCTO' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  await userEvent.click(screen.getByRole('dialog'))
  expect(onClose).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('dialog').parentElement!)
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(3)
})
