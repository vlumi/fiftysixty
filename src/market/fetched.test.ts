import { parseFetched } from './fetched'

test('the note of the last run and the files, and nothing of anything else', () => {
  const text = JSON.stringify({
    at: '2026-11-05T03:23:04.000Z',
    files: { 'jepx-spot-2026.csv': '2026-11-05T03:23:01.000Z', 'tohoku-jukyu-202611.csv': 'soon' },
  })
  expect(parseFetched(text)).toEqual({
    at: '2026-11-05T03:23:04.000Z',
    files: { 'jepx-spot-2026.csv': '2026-11-05T03:23:01.000Z' },
  })
  expect(parseFetched('{"at":"yesterday","files":{}}')).toBeNull()
  expect(parseFetched('{"files":{}}')).toBeNull()
  expect(parseFetched('[]')).toBeNull()
  expect(parseFetched('<!doctype html>')).toBeNull()
})
