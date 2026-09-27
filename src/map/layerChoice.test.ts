import { DEFAULT_LAYERS, loadLayerChoice, saveLayerChoice } from './layerChoice'

test('the layers default to the arrows and the columns without the plants, and a kept choice fills in the rest', () => {
  expect(loadLayerChoice(null)).toEqual(DEFAULT_LAYERS)
  localStorage.setItem('fiftysixty.layers', '{"plants":true,"mixes":"no"}')
  expect(loadLayerChoice()).toEqual({ flows: true, mixes: true, plants: true })
  localStorage.setItem('fiftysixty.layers', 'not json')
  expect(loadLayerChoice()).toEqual(DEFAULT_LAYERS)
  localStorage.clear()
})

test('the default choice is not kept, another is', () => {
  saveLayerChoice({ flows: false, mixes: true, plants: false })
  expect(JSON.parse(localStorage.getItem('fiftysixty.layers')!)).toEqual({ flows: false, mixes: true, plants: false })
  saveLayerChoice({ ...DEFAULT_LAYERS })
  expect(localStorage.getItem('fiftysixty.layers')).toBeNull()
})
