import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function Faulty({ fail }: { fail: boolean }) {
  if (fail) throw new Error('no')
  return <p>fine</p>
}

test('a part that throws while rendering is replaced by the fallback, and one that does not stands', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { rerender } = render(
    <ErrorBoundary fallback={<p>failed</p>}>
      <Faulty fail={false} />
    </ErrorBoundary>,
  )
  expect(screen.getByText('fine')).toBeInTheDocument()
  rerender(
    <ErrorBoundary fallback={<p>failed</p>}>
      <Faulty fail />
    </ErrorBoundary>,
  )
  expect(screen.getByText('failed')).toBeInTheDocument()
  expect(screen.queryByText('fine')).not.toBeInTheDocument()
  vi.restoreAllMocks()
})
