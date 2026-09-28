import { DEFAULT_LAYERS, loadHiddenFuels, loadLayerChoice, saveHiddenFuels, saveLayerChoice } from './layerChoice'

afterEach(() => localStorage.clear())

test('the layers default to the arrows and the columns, and a kept choice fills in the rest', () => {
  expect(loadLayerChoice(null)).toEqual(DEFAULT_LAYERS)
  localStorage.setItem('fiftysixty.layers', '{"flows":false,"mixes":"no"}')
  expect(loadLayerChoice()).toEqual({ flows: false, mixes: true })
  localStorage.setItem('fiftysixty.layers', 'not json')
  expect(loadLayerChoice()).toEqual(DEFAULT_LAYERS)
})

test('the default choice is not kept, another is', () => {
  saveLayerChoice({ flows: false, mixes: true })
  expect(JSON.parse(localStorage.getItem('fiftysixty.layers')!)).toEqual({ flows: false, mixes: true })
  saveLayerChoice({ ...DEFAULT_LAYERS })
  expect(localStorage.getItem('fiftysixty.layers')).toBeNull()
})

test('every fuel is hidden by default, a kept list is read with anything unknown dropped, and all hidden is not kept', () => {
  expect(loadHiddenFuels(null)).toHaveLength(8)
  localStorage.setItem('fiftysixty.plants', '["coal","nonsense","gas"]')
  expect(loadHiddenFuels()).toEqual(['coal', 'gas'])
  localStorage.setItem('fiftysixty.plants', '{"coal":true}')
  expect(loadHiddenFuels()).toHaveLength(8)
  saveHiddenFuels(['hydro'])
  expect(JSON.parse(localStorage.getItem('fiftysixty.plants')!)).toEqual(['hydro'])
  saveHiddenFuels(loadHiddenFuels(null))
  expect(localStorage.getItem('fiftysixty.plants')).toBeNull()
})
