/** Local storage where the browser allows it; null in a private window or a sandbox that forbids it. */
export function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** A stored value, or null when there is none or the store cannot be read. */
export function readItem(key: string, store = storage()): string | null {
  try {
    return store?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Keeps a value, or forgets the key when the value is null; a full or forbidden store means the choice lives on for this visit only. */
export function writeItem(key: string, value: string | null, store = storage()): void {
  try {
    if (value === null) store?.removeItem(key)
    else store?.setItem(key, value)
  } catch {
    // Nothing to do: the choice is kept in memory for the visit.
  }
}
