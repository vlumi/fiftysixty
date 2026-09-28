import { render, screen } from '@testing-library/react'
import { DARK } from '../shared/palette'
import Legend from './Legend'

test('the key draws a ramp per half of the grid with the ends they share, the plan and the record, the limit, a fork and the wall', () => {
  render(<Legend palette={DARK} />)
  const key = screen.getByRole('figure', { name: 'Key' })
  expect(key).toHaveTextContent('50 Hz')
  expect(key).toHaveTextContent('60 Hz')
  expect(key).toHaveTextContent('50+ ¥/kWh')
  expect(key).toHaveTextContent('market split')
  expect(key).toHaveTextContent('OCCTO plan')
  expect(key).toHaveTextContent('recorded')
  expect(key).toHaveTextContent('two lines, total only')
  expect(key.querySelectorAll('svg')).toHaveLength(5)
})
