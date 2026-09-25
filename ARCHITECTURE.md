# Architecture

How fiftysixty works, as built. Everything under *Planned* is intent, kept apart so this file never describes a model that was not built. [SCOPE.md](SCOPE.md) says what and in which order; [AGENTS.md](AGENTS.md) how to work on it.

## Built

**The page.** A header with the name and a map that fills the rest, the same skeleton as nebulosa: `App.tsx` lazy-loads the map view so MapLibre is a chunk of its own, cached across deploys. The map is MapLibre over OpenFreeMap's `fiord` style, bounded to Japan, with the navigation control and nothing drawn on it yet.

**The data.** `scripts/fetch-data.mjs` fetches JEPX's spot-market CSV for the current fiscal year and TEPCO's supply-demand record for the current month into `public/data/` in development and the web root's `data/` in deployment, where a cron job installed by `deploy.sh` refreshes them daily. Both sources are CSV with Japanese headers; JEPX is UTF-8 and TEPCO's files vary by month, so the fetcher decodes each as UTF-8 when valid and Shift_JIS otherwise, and writes UTF-8. JEPX serves its file only with its market page as the referer.

**Theme tokens.** `index.css` carries the dark and light sets, with two colors named for the halves of the grid, `--hz50` and `--hz60`, so the split can be drawn in the app's own palette.

**Tests.** A component test with the map mocked, and two Playwright tests against the built app in headless Chromium with the basemap's tile requests answered empty, so nothing depends on a third party but the style.

## Planned

**Parsing.** A `market/` module parses the CSVs into typed rows: JEPX into `{ date, slot, systemPrice, areaPrice: Record<Area, number>, volume }`, the supply-demand records into `{ date, slot, demand, bySource: Record<Source, number>, curtailed: { solar, wind }, interconnector }` behind one interface per transmission company, since their layouts differ. Tests on real rows cut from the files.

**Regions.** Nine `Area` values; a table from prefecture id to area; the prefecture polygons dissolved per area at build time into a small GeoJSON committed to the repo, so the browser fetches one file. Okinawa is an area with no price and no interconnector and is drawn muted.

**The clock.** nebulosa's frame store and time bar, with the day's 48 slots as the domain instead of a continuous time; the displayed slot drives every layer through one selector.

**Layers.** deck.gl `GeoJsonLayer` for the regions colored by price, `LineLayer` or `ArcLayer` for the interconnectors with width from flow and color from load, `ScatterplotLayer` for plants later; all fed from the store's per-slot selectors, as nebulosa's `layers.ts` is.

**Readouts.** A panel for the selected region with the price, the supply stack for the day as a chart, and the mix for the slot; a legend for price and for sources.
