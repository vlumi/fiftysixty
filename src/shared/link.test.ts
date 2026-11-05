import { formatLink, parseLink } from './link'

const opening = { date: null, slot: 25, area: null, plant: null, half: null, view: 'slot' as const }

test('a link names the day, the half hour, the pick, the half and the view, and only what is not the default', () => {
  expect(formatLink(opening)).toBe('')
  expect(formatLink({ ...opening, date: '2026-09-23', slot: 24, area: 'kansai', view: 'day' })).toBe(
    '?day=2026-09-23&slot=24&area=kansai&view=day',
  )
  expect(formatLink({ ...opening, half: 50, view: 'history' })).toBe('?half=50&view=history')
  // A plant stands for its area, and a half is let go while something is picked.
  expect(formatLink({ ...opening, plant: 'way/1', half: 60 })).toBe('?plant=way%2F1')
  expect(formatLink({ ...opening, area: 'tokyo', half: 60 })).toBe('?area=tokyo')
})

test('a link is read back, and what is malformed is left at its default', () => {
  expect(parseLink('?day=2026-09-23&slot=24&area=kansai&view=day')).toEqual({
    date: '2026-09-23',
    slot: 24,
    area: 'kansai',
    view: 'day',
  })
  expect(parseLink('?plant=way%2F1&half=50&view=history')).toEqual({ plant: 'way/1', half: 50, view: 'history' })
  expect(parseLink('?day=yesterday&slot=49&area=hawaii&half=55&view=map')).toEqual({})
  expect(parseLink('')).toEqual({})
})
