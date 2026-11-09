import { render, screen } from '@testing-library/react'
import { DARK } from '../shared/palette'
import Legend from './Legend'

test('the key draws a ramp per half of the grid with the ends they share, the plan and the record each from idle to full, a fork and the wall', () => {
  render(<Legend palette={DARK} />)
  const key = screen.getByRole('figure', { name: 'Key' })
  expect(key).toHaveTextContent('50 Hz')
  expect(key).toHaveTextContent('60 Hz')
  expect(key).toHaveTextContent('50+ ¥/kWh')
  expect(key).toHaveTextContent('market split')
  expect(key).toHaveTextContent('OCCTO plan')
  expect(key).toHaveTextContent('recorded')
  expect(key).toHaveTextContent('two lines, total only')
  expect(key).toHaveTextContent('Wider, more MW; brighter, nearer the limit.')
  expect(key).not.toHaveTextContent('at the limit')
  expect(key.querySelectorAll('svg')).toHaveLength(4)
  // Each kind's arrow runs from its idle gray to its full color, as the map colors a line by its load.
  const stops = (id: string) => [...key.querySelectorAll(`#key-${id} stop`)].map((x) => x.getAttribute('stop-color'))
  expect(stops('planned')).toEqual(['rgb(120 150 170)', 'rgb(0 230 255)'])
  expect(stops('recorded')).toEqual(['rgb(160 140 185)', 'rgb(220 130 255)'])
})
