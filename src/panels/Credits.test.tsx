import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Credits from './Credits'

test('the about says what the page is, names every source, holds the page still, and closes on the button, the backdrop and Escape', async () => {
  const onClose = vi.fn()
  const { unmount } = render(<Credits onClose={onClose} />)
  expect(screen.getByRole('dialog', { name: 'About' })).toBeInTheDocument()
  expect(screen.getByText(/day-ahead power market on a map/)).toBeInTheDocument()
  expect(document.body.style.overflow).toBe('hidden')
  expect(screen.getByRole('link', { name: 'OpenFreeMap' })).toHaveAttribute('href', 'https://openfreemap.org')
  expect(screen.getByRole('link', { name: 'JEPX' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'OCCTO' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  await userEvent.click(screen.getByRole('dialog'))
  expect(onClose).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('dialog').parentElement!)
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(3)
  unmount()
  expect(document.body.style.overflow).toBe('')
})
