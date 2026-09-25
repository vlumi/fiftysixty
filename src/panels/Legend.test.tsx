import { render, screen } from '@testing-library/react'
import { DARK } from '../shared/palette'
import Legend from './Legend'

test('the key draws the ramp with its ends and the three arrows', () => {
  render(<Legend palette={DARK} />)
  const key = screen.getByRole('figure', { name: 'Key' })
  expect(key).toHaveTextContent('50+ ¥/kWh')
  expect(key).toHaveTextContent('split')
  expect(key.querySelectorAll('svg')).toHaveLength(3)
})
