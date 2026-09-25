# Architecture

How fiftysixty works, as built. Everything under *Planned* is intent, kept apart so this file never describes a model that was not built. [SCOPE.md](SCOPE.md) says what and in which order; [AGENTS.md](AGENTS.md) how to work on it.

## Built

**The page.** A header with the name and a map that fills the rest, the same skeleton as nebulosa: `App.tsx` lazy-loads the map view so MapLibre is a chunk of its own, cached across deploys. The map is MapLibre over OpenFreeMap's `fiord` style, bounded to Japan, with the navigation control and a deck.gl `MapLibreOverlay` interleaved into it beneath the style's first label layer, so the market layers sit under the place names. `map/layers.ts` builds the deck layers as a pure function of the loaded data and a numeric palette, `shared/palette.ts`, which mirrors the CSS tokens for WebGL. MapLibre 6 loads its web worker from a file next to its own script, which a bundled app does not have, so the worker is bundled explicitly and registered at startup, and the browser test waits for a tile request, which only the worker makes.

**The regions.** `regions/areas.ts` is the hand-written table: ten areas with their names, frequency and prefectures by JIS code, the boundaries following the prefecture lines. `scripts/build-regions.mjs` fetches the prefecture polygons from dataofjapan/land, dissolves them per area with mapshaper, drops islands under 20 km², simplifies to 5% and writes `public/geo/areas.geojson`, 56 kB and committed; the 50/60 split line is the inner boundary between the dissolved halves, written beside it. The app fetches both once and draws the areas filled by their frequency with the split line in the accent color, credited to 地球地図日本 in the map's attribution.

**The data.** `scripts/fetch-data.mjs` fetches JEPX's spot-market CSV for the current fiscal year and TEPCO's supply-demand record for the current month into `public/data/` in development and the web root's `data/` in deployment, where a cron job installed by `deploy.sh` refreshes them daily. Both sources are CSV with Japanese headers; JEPX is UTF-8 and TEPCO's files vary by month, so the fetcher decodes each as UTF-8 when valid and Shift_JIS otherwise, and writes UTF-8. JEPX serves its file only with its market page as the referer.

**Theme tokens.** `index.css` carries the dark and light sets, with two colors named for the halves of the grid, `--hz50` and `--hz60`, so the split can be drawn in the app's own palette.

**The prices.** `market/jepx.ts` parses JEPX's spot CSV into a map from delivery day to its 48 slots, each with the system price, the nine area prices keyed by area id and the contracted volume; the columns are found by their Japanese names, so a reordered header still parses and a missing one is an error. `App.tsx` loads the current fiscal year's file once and passes the displayed slot's prices down as props.

**The clock.** `store.ts` holds what the reader has chosen: the delivery day (null for the newest priced day), the half-hour slot and the selected area, as plain zustand actions tested without React. `time/TimeBar.tsx` is a controlled row of native inputs, a date picker bounded to the days there are prices for and a range over the 48 slots, with the slot's half hour read out beside them; native inputs scrub and take the keyboard for free. Play at speed is M4.

**The price on the map.** With prices, the areas are filled through `shared/scale.ts`: one warm hue from near the surface to bright over a fixed 0 to 50 yen domain, so one day's colors mean the same as another's; Okinawa, which has no price, is muted. `panels/Legend.tsx` draws the same ramp with its ends.

**The readout.** `panels/Readout.tsx` shows the displayed slot in numbers: with nothing picked, the system price and the spread across the areas; with an area picked by a click on the map, its price against the system price and against each neighbor across an interconnector. `regions/interconnectors.ts` is the hand-written list of the ten lines with their ends and kind, AC, HVDC or the frequency converters; the capacities come with OCCTO's data in M3. The picked area is outlined on the map.

**Tests.** Unit tests on real rows cut from the JEPX file, which also feed the browser tests; component tests with the map mocked; Playwright against the built app in headless Chromium with the basemap's tile requests answered empty and the price file served from the fixture, so nothing depends on a third party but the style.

## Planned

**Parsing the records.** The supply-demand records into `{ date, slot, demand, bySource: Record<Source, number>, curtailed: { solar, wind }, interconnector }` behind one interface per transmission company, since their layouts differ. Tests on real rows cut from the files.

**Playing.** nebulosa's frame store and eased clock, with the day's 48 slots as the domain, so a day runs in seconds.

**Layers.** `LineLayer` or `ArcLayer` for the interconnectors with width from flow and color from load, `ScatterplotLayer` for plants later; all fed from the store's per-slot selectors, as nebulosa's `layers.ts` is.

**Readouts.** The supply stack for the day as a chart and the mix for the slot beside the price; a legend for sources.
