import { fetchTime, jepxFile, latestFetch, occtoFile, publisherOf, recordFile } from './sources'

const fetched = {
  at: '2026-11-05T11:13:36Z',
  files: {
    'jepx-spot-2025.csv': '2026-09-25T12:07:06Z',
    'jepx-spot-2026.csv': '2026-11-05T11:13:19Z',
    'occto-renkei-202611.csv': '2026-11-05T11:13:18Z',
    'tepco-jukyu-202611.csv': '2026-11-05T11:13:33Z',
    'kyushu-jukyu-202611.csv': '2026-11-05T11:13:36Z',
    'hokkaido-jukyu-202610.csv': '2026-11-02T05:00:40Z',
  },
}

test("a day's figures come from JEPX's fiscal year, OCCTO's month and the area's company's month", () => {
  expect(jepxFile('2026-03-31')).toBe('jepx-spot-2025.csv')
  expect(jepxFile('2026-04-01')).toBe('jepx-spot-2026.csv')
  expect(occtoFile('2026-11-05')).toBe('occto-renkei-202611.csv')
  expect(recordFile('tokyo', '2026-11-05')).toBe('tepco-jukyu-202611.csv')
  expect(recordFile('kyushu', '2026-10-31')).toBe('kyushu-jukyu-202610.csv')
})

test('the files sort to their publishers by name', () => {
  expect(publisherOf('jepx-spot-2026.csv')).toBe('jepx')
  expect(publisherOf('occto-renkei-202611.csv')).toBe('occto')
  expect(publisherOf('tohoku-jukyu-202611.csv')).toBe('record')
  expect(publisherOf('fetched.json')).toBeNull()
})

test("a publisher's freshness is its newest file's time, a file's its own, and none without the note", () => {
  expect(latestFetch(fetched, 'jepx')).toBe('2026-11-05T11:13:19Z')
  expect(latestFetch(fetched, 'record')).toBe('2026-11-05T11:13:36Z')
  expect(latestFetch({ at: fetched.at, files: {} }, 'occto')).toBeNull()
  expect(latestFetch(null, 'jepx')).toBeNull()
  expect(fetchTime(fetched, 'tepco-jukyu-202611.csv')).toBe('2026-11-05T11:13:33Z')
  expect(fetchTime(fetched, 'tepco-jukyu-202612.csv')).toBeNull()
})
