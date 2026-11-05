# fiftysixty

Fifty-sixty. More or less.

The Japanese power market on a map: the day-ahead price in each region, what actually ran to meet demand, and the flows between the regions, half hour by half hour and day by day, from public data.

Japan's grid is nine regional markets joined by a handful of interconnectors and split down the middle between 50 Hz in the east and 60 Hz in the west. Every half hour each region clears a price on the JEPX exchange, and every half hour the transmission companies publish what ran: nuclear, thermal, hydro, solar, wind, pumped storage, and how much crossed each interconnector. The numbers are public, as tables. This draws them.

Unofficial demo project, built from public data; not affiliated with any exchange, grid operator or utility.

Live at [fiftysixty.misaki.fi](https://fiftysixty.misaki.fi). [SCOPE.md](SCOPE.md) is the plan; [ARCHITECTURE.md](ARCHITECTURE.md) explains how it works.

![A Sunday noon at the floor from the 50 Hz point of view: the east outlined and the west muted on the map, and the readout scoped to the half, its spread, its areas against the system price, the frequency converters as its lines, its price curve and its supply summed](docs/screenshots/008-the-halves.png)

<img src="docs/screenshots/008-the-halves-phone.png" alt="The 60 Hz half on a phone: the three-way control, the west's six areas against the system price, the frequency converters as its lines, and its price curve" width="260">

Every capture, one per milestone, is shown in [docs/screenshots](docs/screenshots/README.md). The interface comes in English and Japanese, dark and light.

## What you will see

**The regions.** Each of the nine priced areas colored by its price in the displayed half-hour slot, with its supply mix beside it: how much of the demand was nuclear, gas, coal, hydro, solar, wind, and how much solar was curtailed.

**The interconnectors.** Arrows between the regions sized by the flow and colored by how close it is to the line's limit: violet where the companies' records say what crossed, cyan where only OCCTO's plan is there yet, and a fork with one total where the numbers do not say how a loop divides between its lines. The three frequency-converter stations between the two halves are one of the lines, since that is where the east and west prices part.

**The market splits.** A wall on the border wherever the day-ahead auction priced two neighbors apart, so the areas walled in together are the markets that cleared as one.

**The clock.** A time bar over the day with 48 slots and a date picker, so the solar hump can be watched rolling across the country at noon, the price collapsing under it and the evening peak arriving; play runs a day in seconds, and a menu jumps to the days the prices single out, the summer and the winter peak, the widest split, the most at the floor, the cheapest day.

**Whole days.** A switch turns the readout from the half hour to the day: how the day's energy was supplied, source by source in GWh and shares, the peak and the low, the renewable share, the price weighted by demand and an estimate of the CO₂; for an area or all Japan, with the month's days side by side to scrub through and compare.

**The price over time.** The day's auction as a curve above the supply chart, the picked area in its half's color over the dashed system price, or with nothing picked every area, so the day forks where the market split; under it, with nothing picked, what was offered, asked and cleared each half hour, since when far more is offered than asked the price falls to the floor. The day view gives the mean and the range with their half hours, and the month's strip a bar from each day's low to its high; a third view lays every priced day held as a heatmap, a day across and the 48 half hours down, a slider in both directions.

**The halves.** A control above the readout scopes it to 50 Hz or 60 Hz: the half's spread as the headline, its areas against the system price, the three frequency converters as its only lines, and its supply summed from its areas' records; on the map the other half is muted and the half outlined.

**The plants.** A layer to switch on, by fuel and capacity as OpenStreetMap maps them; what each one is running is not public, only the per-area totals, and the map says so.

**The keys.** Arrows step the half hour, Shift and an arrow the day, up and down walk the areas; ? lists the rest.

## The name

Fifty-sixty is the grid: 50 Hz east of the Fossa Magna, 60 Hz west of it, a division from the 1890s that still limits how much power can cross between the halves. It is also what Matti Nykänen said when he meant "more or less", which is what any forecast of tomorrow's price is. Styled 50/60 in the title.

## Data

- **JEPX day-ahead spot market**: system and area prices, bid and contracted volumes, per half hour, one CSV per fiscal year.
- **Area supply-demand records** from all nine transmission companies, half-hourly, by source, curtailment and what crossed the area's borders.
- **OCCTO**'s reserve-margin data for each interconnector's operating capacity, its planned flow and whether the market split across it.
- Region boundaries from the prefecture polygons of [dataofjapan/land](https://github.com/dataofjapan/land), derived from GSI's 地球地図日本 (Global Map Japan); the plants from OpenStreetMap, © OpenStreetMap contributors; the CO₂ factors after CRIEPI (2016).

Everything is fetched by a script on the host once an hour and served as static files. No backend, no account, no key.

## Development

```sh
npm install
npm run data      # fetch the current data into public/data
npm run dev       # http://localhost:5173
npm test          # unit and component tests
npm run test:e2e  # browser tests against the built app
npm run regions   # rebuild the committed area, split and border geometry
npm run plants    # rebuild the committed plants from Overpass
```

Node 24 or newer and curl. CI runs `npm run lint && npm run lint:md && npm run format:check && npm test && npm run build`, then the browser tests; `npm run format` fixes what prettier flags.

`./deploy.sh` builds and publishes a release under a web root and installs the hourly data refresh; [nginx.conf.example](nginx.conf.example) is the server block.

## License

MIT for the code; see [LICENSE](LICENSE). The committed geometry derives from GSI's 地球地図日本, attribution required and non-commercial, and the plants from OpenStreetMap under the ODbL; the fetched data belongs to its publishers under their own terms. All are credited in the app.
