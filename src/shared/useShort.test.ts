import { renderHook } from '@testing-library/react'
import { SHORT_QUERY, useShort } from './useShort'

afterEach(() => vi.unstubAllGlobals())

test('short follows its media query; without matchMedia it is false', () => {
  expect(renderHook(() => useShort()).result.current).toBe(false)
  const matchMedia = vi.fn((query: string) => ({
    matches: query === SHORT_QUERY,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('matchMedia', matchMedia)
  expect(renderHook(() => useShort()).result.current).toBe(true)
})
