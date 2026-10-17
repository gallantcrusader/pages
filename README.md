# StormCheck

**Hurricane & disaster info by ZIP code — built for phones.**
Live: https://gallantcrusader.github.io/pages/

StormCheck keeps people in storm- and disaster-prone areas informed during an event like a hurricane. Enter a ZIP code (or use your location) and get:

| | What you get |
|---|---|
| **Live feed** | National Weather Service alerts, active hurricanes and forecast cones, NWS local storm reports (flooding, wind damage, surge) within 60 miles, river/flood gauges, FEMA disaster declarations for your county, radar, and community reports. Refreshes every 5 minutes. |
| **Power outages** | Your electric company's outage map and report line, a food-safety timer (fridge 4 hr / freezer 24–48 hr), statewide outage counts, generator and downed-line safety, and "unofficial signals" (the Whataburger-app trick Houston used after Hurricane Beryl). |
| **Internet & cell outages** | Your ISP/carrier status pages and crowd outage reports, an in-browser "is it just me?" connection check, FCC disaster outage reports, and tips for getting back online. |
| **Boil-water notices** | Your water system, official places to check for notices, community boil-water reports for your ZIP, boil instructions, and an EPA-based bleach calculator. |
| **Provider accountability** | A private, timestamped outage log (reports, ticket numbers, every promised restoration time, missed ETAs, response times) that turns into a bill-credit request or a complaint, plus who to file with (state utility commission, FCC, attorney general). A public community board with a provider scorecard. |
| **Safety** | Offline guides: prep checklist, during/after the storm, power outages, generators & carbon monoxide, boil water, flooding, heat illness, food & insulin, scams, mental health. Emergency numbers you can save to your phone's contacts or print. |

### Finding providers
- **Automatically:** the app looks up the ZIP's center point on public service-territory maps (electric: EIA/ORNL retail service territories via Pacific Northwest National Laboratory; water: EPA community water system boundaries) and matches the result to its directory.
- **From drop-downs:** each service has a drop-down with providers common in your ZIP, in your state, and nationwide — or type in your own.
- Providers are saved per ZIP, so you can also check on family elsewhere.

### Built to work during a storm
- Plain HTML/CSS/JavaScript, no frameworks, no web fonts, no build step — loads fast on a weak signal.
- Installable (Add to Home Screen) and **works offline** after the first visit; live feeds show their last saved data, marked stale, when the network drops.
- ZIP data (41,000+ ZIPs incl. Puerto Rico, USVI and Guam) ships with the site, so lookups don't depend on a third-party API.
- Dark mode (saves battery on OLED phones) and a data-saver mode.
- Shareable links: `…/pages/?zip=32541` opens that ZIP.

## Privacy
No accounts, cookies, analytics or ads. Your ZIP, providers, checklists and outage logs live only in your browser's local storage. Live data is requested straight from public agencies using the ZIP's center point. Community reports are public GitHub issues.

## Community reports
Reports are GitHub issues created from the **Community report** form (`.github/ISSUE_TEMPLATE/community-report.yml`); the site reads issues whose title starts with `[Report]`. Posting needs a free GitHub account. Moderate by closing or deleting issues — closed reports count as resolved on the scorecard. Creating a `community-report` label in the repo lets the form tag reports automatically.

## Editing
| To change… | Edit |
|---|---|
| Featured event banner (currently Hurricane Isaias recovery) | `js/config.js` → `featuredEvent` |
| Providers, phone numbers, outage map links, county suggestions | `js/providers.js` |
| State agencies, evacuation zones, regulators | `js/states.js` |
| Safety guide text | `js/guides.js` |
| Emergency numbers | `js/states.js` → `NATIONAL_CONTACTS` |

If you change any file listed in `sw.js`, bump `VERSION` there (and the matching cache name in `js/app.js`) so phones pick up the update.

Rebuild the ZIP data (only needed to refresh it):
```sh
npm pack zipcodes-us zipcodes-nrviens   # then extract both tarballs
python3 scripts/build_zip_data.py <zipcodes-us>/data/US.txt <zipcodes-nrviens> data/zip
```

## Run locally
```sh
python3 -m http.server 8080   # then open http://localhost:8080
```

## Deploy
GitHub Pages serves the repository root as-is (`.nojekyll` is included). In **Settings → Pages**, set the source to **Deploy from a branch** and pick the branch that has this code, folder `/ (root)`.

## Data sources & credits
- Weather alerts, forecasts, radar: [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
- Tropical cyclones: [National Hurricane Center](https://www.nhc.noaa.gov)
- Local storm reports: NWS via the [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu)
- River gauges: [NOAA National Water Prediction Service](https://water.noaa.gov)
- Disaster declarations: [OpenFEMA](https://www.fema.gov/about/openfema)
- Water system boundaries: U.S. EPA; electric retail service territories: EIA / Oak Ridge National Laboratory, hosted by Pacific Northwest National Laboratory
- ZIP codes: [GeoNames](https://www.geonames.org) (CC BY 4.0) and the `zipcodes-nrviens` package (BSD-2-Clause)
- Safety guidance: Ready.gov, CDC, EPA, USDA/FoodSafety.gov, FDA, FEMA

StormCheck is not an official source. Always follow local officials. In an emergency, call 911.
