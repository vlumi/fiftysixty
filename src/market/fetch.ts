/**
 * A data file's text; null when the host has no such file, a 404 or a page in its place, as a dev server answers a
 * missing file with the app's own page. Any other failure is an error.
 */
export async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url)
  if (response.status === 404 || response.headers.get('content-type')?.includes('text/html')) return null
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.text()
}
