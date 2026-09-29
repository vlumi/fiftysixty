# fiftysixty — scope

The Japanese power market on a map, from public data. A sibling of [nebulosa](https://github.com/vlumi/nebulosa), built the same way and on the same stack, and for the same reason: to understand a domain by looking at it.

**The name:** 50 Hz east, 60 Hz west, and the three converter stations between them that cap the flow across the middle of the country; also Nykänen's *fifty-sixty*, "more or less", which is what a day-ahead price is. Styled 50/60.

**Status:** unofficial demo project, not affiliated with JEPX, OCCTO or any utility. Bootstrapped 2026-09-25 with the toolchain and a map of Japan; the same day, the day-ahead price on the map, what ran in every area, the flows between them, play and the story days, and the plants, the phone layout, the light theme and the Japanese interface: every milestone below through M5 landed on the first day, and M6, whole days and the recorded flows, by 2026-09-29.

## Data

All public, all fetched by `scripts/fetch-data.mjs` on the host into `data/` and served as static files; nothing is committed, and the browser never talks to a third party except the basemap tiles.

- **JEPX day-ahead spot market.** `https://www.jepx.jp/js/csv_read.php?dir=spot_summary&file=spot_summary_<fiscal year>.csv`, served only with `Referer: https://www.jepx.jp/electricpower/market-data/spot/`. UTF-8 CSV, one row per half hour, fiscal year April to March, published for the next day after the 10:00 auction. Columns: 受渡日, 時刻コード (1 to 48), 売り入札量, 買い入札量, 約定総量 (kWh), システムプライス, then エリアプライス for 北海道, 東北, 東京, 中部, 北陸, 関西, 中国, 四国, 九州 (円/kWh), then the block-bid volumes. About 17,500 rows a year.
- **Area supply-demand records** (エリア需給実績), half-hourly, by source, from all nine transmission companies in OCCTO's shared layout, Kyushu with two departures. TEPCO, for example: `https://www.tepco.co.jp/forecast/html/images/eria_jukyu_<YYYYMM>_03.csv`, one file per month, UTF-8 or Shift_JIS depending on the month (the fetcher writes UTF-8), a units line then the header `DATE, TIME, エリア需要, 原子力, 火力(LNG), 火力(石炭), 火力(石油), 火力(その他), 水力, 地熱, バイオマス, 太陽光発電実績, 太陽光出力制御量, 風力発電実績, 風力出力制御量, 揚水, 蓄電池, 連系線, その他, 合計`, in MW averaged over the half hour; the list of months is on `area_jukyu-j.html`. Each company has its own host; Tohoku posts the running month a day at a time, and Chubu's previous month sits behind a download form and is not fetched.
- **OCCTO.** The public 広域予備率 site's interconnector file (`https://web-kohyo.occto.or.jp/kks-web-public/download/downloadCsv?jhSybt=06&…`, a month per request): each line's operating capacity both ways, a planned flow and whether the market split across it, per half hour. The planned flow is set per block of similar days and never revised; what actually crossed comes from the companies' records.
- **Region geometry.** Nine areas as unions of prefectures. Prefecture polygons from `dataofjapan/land` (derived from GSI's Global Map Japan; attribution to 地球地図日本 required, non-commercial) simplified with mapshaper to about 56 kB and committed. The area-to-prefecture table is hand-written (Okinawa is its own area with no interconnector and no JEPX price; Shizuoka's Fuji river splits it between Tokyo and Chubu, drawn on the prefecture line for now).
- **Interconnectors.** A hand-written list of the lines with their endpoints and nominal capacities: Hokkaido–Tohoku (the Kitahon HVDC), Tohoku–Tokyo, the three frequency converters (Sakuma, Shin-Shinano, Higashi-Shimizu) between Tokyo and Chubu, Chubu–Hokuriku, Chubu–Kansai, Hokuriku–Kansai, Kansai–Chugoku, Kansai–Shikoku, Chugoku–Shikoku, Chugoku–Kyushu. The capacities come per half hour with OCCTO's file.
- **Plants.** OpenStreetMap's power plants with an electric output tagged, `power=plant` with `plant:source` and `plant:output:electricity`, via Overpass; the big units are well mapped, solar and wind thinly. Committed as a small GeoJSON, © OpenStreetMap contributors under the ODbL. Output per plant is not public.

## Tech

- **App:** React + TypeScript + Vite, the nebulosa toolchain copied whole: oxlint, prettier, markdownlint, Vitest with jsdom, Playwright on the built app, a CI that runs all of it.
- **Rendering:** deck.gl interleaved into a MapLibre GL basemap (OpenFreeMap vector tiles, free, no key), flat, bounded to Japan; the globe is not needed here.
- **State:** zustand, one store for the reader's choices, the same time bar pattern as nebulosa.
- **Data path:** a Node script fetches the CSVs into `data/`, the browser parses them; parsing and per-slot aggregation in a worker if it gets heavy.
- **Hosting:** static files behind nginx, `deploy.sh` publishing releases and installing the hourly fetch, as nebulosa with a faster clock.
- **License:** MIT.

## Milestones

### M0 — bootstrap (done 2026-09-25)

Toolchain, CI, a map of Japan under the name, the data fetcher for JEPX and TEPCO with real files verified, deploy script and nginx block.

### M1 — the price on the map (done 2026-09-25)

- Regions drawn from the prefecture polygons, colored by their JEPX area price for the displayed slot, with a legend.
- A time bar over one day with the 48 slots, scrubbable, and a date picker; the price per region updates as the slot moves.
- A readout for the selected region: its price, the system price, the spread to its neighbors.
- The 50/60 line drawn across the middle, since it is the name.

### M2 — what ran (done 2026-09-25)

- TEPCO's supply-demand record parsed and drawn for its region: the supply stack under the demand line for the displayed day, and the mix for the displayed slot beside the region on the map.
- A second transmission company (Kyushu, for curtailment) through the same interface, then the other seven the same day: all nine publish OCCTO's layout, Kyushu with two departures.
- Solar and wind curtailment shown distinctly, since it is the most visible thing the market does.

### M3 — the flows (done 2026-09-25)

- The interconnectors as arrows between regions, width by flow, color by share of capacity, first from OCCTO's planned flows; the market split marked. Measured per-line flows are on OCCTONET behind a browser session and are not fetched.
- The price split made visible: when the middle is saturated, the east and west prices diverge, and the map shows the cause and the effect at once.

### M4 — the story days (done 2026-09-25)

- Named days to jump to, chosen from the prices rather than by hand: the summer and the winter peak by the system price, the widest split between areas, the day with the most half hours at the floor, and the cheapest day; last fiscal year's prices are held for the winter. A typhoon is not in the prices, so there is no typhoon day.
- Play at speed, so a day runs in seconds: four half hours a second, on into the next day.

### M5 — closer in (done 2026-09-25)

- The plants by fuel and capacity as a layer switched on when wanted, honest about showing capacity and not output: from OpenStreetMap, the 419 tagged with an output of 10 MW or more (done 2026-09-25).
- Phone layout (the key and the readout fold to a button and a headline), light theme, English and Japanese interfaces, following the nebulosa patterns.

### M6 — whole days and the recorded flows (done 2026-09-29)

- The flows as the records settle them when all nine are in, violet, OCCTO's plan otherwise, cyan, never mixed; forks where the numbers give a loop's totals only.
- The market split as a wall on the border, from the area prices.
- A day view: the day's energy by source, the peak, the renewable share, the price weighted by demand and an estimated CO₂, per area and for all Japan, with the areas not yet recorded named; the month's days side by side to scrub.
- The keyboard, an accessibility round with axe in the browser tests, and the layers switched in a panel.

## Non-goals

- No backend, no accounts, no live trading data: the day-ahead price and yesterday's record are the resolution.
- No forecasting, no claim of operational accuracy: a visualization of published numbers, not a market model.
- No per-plant output: it is not public, and the map does not pretend otherwise.
