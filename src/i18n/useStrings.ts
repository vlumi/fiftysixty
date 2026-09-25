import { useApp } from '../store'
import { STRINGS, type Strings } from './strings'

/** The words in the chosen language. */
export const useStrings = (): Strings => STRINGS[useApp((s) => s.lang)]
