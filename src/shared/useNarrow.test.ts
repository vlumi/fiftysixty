import { act, renderHook } from '@testing-library/react'
import { NARROW_QUERY, useNarrow } from './useNarrow'

afterEach(() => vi.unstubAllGlobals())

test('narrow follows the media query and its changes; without matchMedia it is false', () => {
  expect(renderHook(() => useNarrow()).result.current).toBe(false)
  const listeners: (() => void)[] = []
  const media = {
    matches: true,
    addEventListener: (_: string, l: () => void) => listeners.push(l),
    removeEventListener: vi.fn(),
  }
  const matchMedia = vi.fn((query: string) => (query === NARROW_QUERY ? media : { matches: false }))
  vi.stubGlobal('matchMedia', matchMedia)
  const { result } = renderHook(() => useNarrow())
  expect(result.current).toBe(true)
  media.matches = false
  act(() => listeners.forEach((l) => l()))
  expect(result.current).toBe(false)
})
