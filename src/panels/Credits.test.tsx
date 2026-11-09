import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Credits from './Credits'

test('the about says what the page is, names every source, holds the page still, and closes on the button, the backdrop and Escape', async () => {
  const onClose = vi.fn()
  const { unmount } = render(<Credits onClose={onClose} />)
  expect(screen.getByRole('dialog', { name: 'About' })).toBeInTheDocument()
  expect(screen.getByText(/day-ahead power market on a map/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Keyboard' })).toBeInTheDocument()
  expect(screen.getByText('Esc')).toBeInTheDocument()
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

test("each publisher's freshness from the fetcher's note, in Japan's time, and the table of what each figure is", () => {
  const files = {
    'jepx-spot-2025.csv': '2026-09-25T12:07:06Z',
    'jepx-spot-2026.csv': '2026-11-05T03:23:01Z',
    'tepco-jukyu-202611.csv': '2026-11-05T03:22:40Z',
    'kyushu-jukyu-202611.csv': '2026-11-05T02:22:40Z',
  }
  render(<Credits fetched={{ at: '2026-11-05T03:23:04Z', files }} onClose={vi.fn()} />)
  expect(screen.getByText('Prices').nextElementSibling).toHaveTextContent('JEPXupdated 2026-11-05 12:23 JST')
  expect(screen.getByText('Supply and demand').nextElementSibling).toHaveTextContent('updated 2026-11-05 12:22 JST')
  expect(screen.getByText('Interconnectors').nextElementSibling).not.toHaveTextContent('updated')
  expect(screen.getByText(/asks every publisher hourly/)).toBeInTheDocument()
  const rows = screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => [...r.querySelectorAll('th, td')].map((c) => c.textContent))
  expect(rows).toEqual([
    ['Prices, bids, cleared volume', 'JEPX', 'contract', 'the day before, after the 10:00 auction'],
    [
      'Demand, supply by source, curtailment, border flows',
      'The nine transmission companies',
      'actual',
      'within about an hour of the half hour; Hokkaido two days later',
    ],
    ['Line capacity, planned flow, market split', 'OCCTO', 'plan', 'two days ahead, around 17:30'],
    ['Turnover, weighted price, renewable share, CO₂', 'This site', 'estimate', 'computed here from the above'],
  ])
})
