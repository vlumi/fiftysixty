import { fireEvent, render, screen } from '@testing-library/react'
import { scrub } from './scrub'

function Slider({ pick }: { pick: (x: number) => void }) {
  return <div role="slider" aria-label="x" tabIndex={0} {...scrub<HTMLDivElement>((e) => pick(e.clientX))} />
}

function slider(pick: (x: number) => void) {
  render(<Slider pick={pick} />)
  const el = screen.getByRole('slider')
  el.setPointerCapture = vi.fn()
  return el
}

test('a mouse picks on the press and scrubs while a button is down', () => {
  const pick = vi.fn()
  const el = slider(pick)
  fireEvent.pointerDown(el, { clientX: 10, pointerId: 1, pointerType: 'mouse' })
  expect(el.setPointerCapture).toHaveBeenCalledWith(1)
  fireEvent.pointerMove(el, { clientX: 20, pointerId: 1, buttons: 1 })
  fireEvent.pointerMove(el, { clientX: 30, pointerId: 1, buttons: 0 })
  fireEvent.pointerUp(el, { clientX: 40, pointerId: 1, pointerType: 'mouse' })
  expect(pick.mock.calls.flat()).toEqual([10, 20])
})

test('a finger that sets off down the chart, the first move the browser delivers before it scrolls, picks nothing', () => {
  const pick = vi.fn()
  const el = slider(pick)
  fireEvent.pointerDown(el, { clientX: 10, clientY: 100, pointerId: 2, pointerType: 'touch' })
  fireEvent.pointerMove(el, { clientX: 14, clientY: 72, pointerId: 2, buttons: 1, pointerType: 'touch' })
  fireEvent.pointerCancel(el, { pointerId: 2, pointerType: 'touch' })
  expect(pick).not.toHaveBeenCalled()
})

test('a finger scrubs once it has gone further sideways than down, and a tap picks when it lifts', () => {
  const pick = vi.fn()
  const el = slider(pick)
  fireEvent.pointerDown(el, { clientX: 50, clientY: 100, pointerId: 3, pointerType: 'touch' })
  expect(pick).not.toHaveBeenCalled()
  fireEvent.pointerMove(el, { clientX: 62, clientY: 104, pointerId: 3, buttons: 1, pointerType: 'touch' })
  fireEvent.pointerMove(el, { clientX: 64, clientY: 130, pointerId: 3, buttons: 1, pointerType: 'touch' })
  fireEvent.pointerUp(el, { clientX: 70, clientY: 130, pointerId: 3, pointerType: 'touch' })
  expect(pick.mock.calls.flat()).toEqual([62, 64, 70])
  fireEvent.pointerDown(el, { clientX: 90, clientY: 100, pointerId: 4, pointerType: 'touch' })
  fireEvent.pointerUp(el, { clientX: 90, clientY: 100, pointerId: 4, pointerType: 'touch' })
  expect(pick.mock.calls.flat()).toEqual([62, 64, 70, 90])
})
