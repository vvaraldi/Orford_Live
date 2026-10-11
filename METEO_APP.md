# Météo app - decisions and plan (started 2026-10-09)

A new app to record the weather, "Météo" for now. Time spent is logged apart in `TIME_LOG_METEO.md`.
Nothing is built yet: this is the agreed scope and the plan, to be confirmed before work starts.

## Decisions (from the owner's answers)

- **Name / look:** "Météo"; snowflake in the ski season (1 Nov - 30 Apr), sun in the bike season (1 May - 31 Oct),
  chosen by the date (not by the activity the user picked); yellowish module colour.
- **Access:** its own profile permission (like the other apps), the same in both seasons.
- **Entry:** done mostly in an office, a few records a day at most, each with its own date and time (editable).
  The form shows the web values we could get, and the manual inputs start blank. Both are kept; a manual value
  replaces the web one for display, the original web value stays and can be restored.
- **Fields (v1):** temperature, feels-like (température ressentie), wind speed / direction / gusts, rain,
  new snow in 24 h (cm), snow depth at the base (cm), cloud cover (clear / partly / overcast), sky conditions
  (sun, snow, rain, fog), visibility, humidity, pressure, free comment.
- **Location:** one place for now, stored so that more places can be added later.
- **Who edits:** the author, the allowed users and the admins can modify any record; only the system admin deletes.
- **Admin:** the same two tabs as the other apps (Statistiques, Gestion des données). Statistics: temperature and
  snowfall charts for the season (one value per day: the record closest to noon), and the number of days with
  no data in the last 20 days.
- **Public:** only the LAST reading, no names. The Mont Orford website will pull it directly (like the trail
  status). The lobby screen is the public status page, which always shows the latest reading.
- **Admin toggle (confirmed 2026-10-09):** it only controls whether the weather is SHOWN WHEN LOOKING AT A REPORT
  (to limit data requests). It does not hide the public reading.
- **Reports (later):** show the weather of the nearest record in time, with the day and time it was recorded.
  The weather is NOT copied into the report.
- **Web defaults:** Environment Canada if possible, started by hand (no scheduled fetch, no server).
  Snow and the other values it lacks are typed by hand.

## What Environment Canada gives (checked 2026-10-09)

Public JSON, no key, readable from a page (cross-site calls allowed):
`https://api.weather.gc.ca/collections/swob-realtime/items?f=json&bbox=...` (hourly observations).

| Station | Distance | Gives | Does not give |
|---|---|---|---|
| LAC MEMPHREMAGOG (ECCC, 208 m) | ~7 km | temperature, humidity, dew point, wind (10 min / 1 h average, gusts, direction) | pressure, clouds, visibility, precipitation, snow |
| Sherbrooke airport CYSC (NAV CANADA, 241 m) | ~40 km | pressure, clouds, visibility, present weather, precipitation 24 h, temperature, wind | snow depth, new snow |

- Feels-like is computed from temperature, wind and humidity (wind chill / humidex formulas).
- Snow depth and new snow come from nobody: always typed by hand.
- **Licence to settle before publishing:** the Sherbrooke observations carry "Observational data provided by
  NAV CANADA. All rights reserved." Showing them on a public page may not be allowed; the Lac Memphrémagog
  data is Environment Canada open data (attribution). Safe default: Sherbrooke values appear only as hints in
  the office form, and only values typed by the user or from Lac Memphrémagog are published.
- The private Eastman station (`IEASTM15` on Weather Underground) is not used: it needs the owner's API key
  and is not at the mountain. Keep it in mind for later; a station on the mountain would replace both.

## Plan (small steps, each tested and reported)

1. **Foundation:** permission `allowMeteo` (profile, user admin, rules), portal tile with the seasonal symbol,
   yellow module colour, navigation (Météo + an Admin entry), Firestore rules for the new collections.
2. **Data and web values:** collection `weather_records` (date/time, place, manual values, web values with their
   source and observation time, comment, author), a small service that reads Environment Canada on request and
   computes the feels-like.
3. **Entry page:** web values next to blank manual inputs, date/time, save; today's records; edit by the
   author / editors / admins; restore a web value.
4. **Admin:** statistics (season charts, missing days) and Gestion des données, built on the shared engine.
5. **Public:** a public "latest reading" document (no names) written when a record is saved, the weather panel on
   the public status page, the admin toggle to show or hide it, and the web address the Mont Orford site reads.
6. **Reports (later):** the nearest record in time on the report views, controlled by the same toggle.
7. Tests (mocked Firebase and a canned Environment Canada answer) and the rules checklist, like the other apps.

## Confirmed on 2026-10-09

- Sherbrooke airport values are only hints in the office form; only values typed by the user or from the
  Lac Memphrémagog station are published.
- For the public reading a typed value wins; the (publishable) web value shows when nothing was typed.
- Billable or free: no decision yet. Keep the time log (`TIME_LOG_METEO.md`); the quote, when asked, stays short.

## Still to confirm

- Units: °C, km/h, mm, cm, %, kPa, km.

## Progress

- **Step 7 - Checks and final review: DONE (2026-10-09)** - the checklist for the REAL site is in `tests/README.md`
  ("Météo: what the tests cannot prove", 10 steps). Checked from here on the real service after the rules were
  published: the public address answers **404 "not found"** (rules accept the public read; no reading yet), and its
  cross-site header answers for any origin (a page on montorford.com can read it). Final review: no leftover debug
  code, every id used by the pages exists in their markup, the rules file's brackets balance, the 13 measures and the
  public document's keys match between the app and the rules. One real fix: the web feels-like was computed from the
  WEB temperature; with a different TYPED temperature it described another temperature. It is now worked out again
  from the typed one (wind chill, with the wind kept), and left out from 20 °C up (a humidex needs a dew point that is
  not kept); a typed feels-like always wins. Open for later (not done on purpose): old reports (before the app)
  show a quiet "Aucun relevé météo" line and cost one read each when opened; an option would be to skip reports older
  than the first reading (a date in the config); the rules cannot be run here, so the checklist is the proof.

- **Small additions (2026-10-09, evening):** (3.4) Administration > Données: a **Météo** option in the data export
  (JSON: the readings as stored with readable dates; CSV `_Meteo.csv`: one row per reading, for each measure the
  typed value `<mesure>` and the web value `<mesure>_web`, who entered it; both seasons, no activity filter).
  (3.7) a quick 🗑️ button on every row of the Relevés list (system admin only, with a confirmation, like the delete
  inside the form; the public "latest reading" follows).

- **Step 6 - Weather in reports: DONE (2026-10-09)** - when a report is opened in the Gestion pages of Inspections,
  Infractions, Signalisations and Entretien, a box at the top of the report view shows the reading NEAREST IN TIME
  (12 h at most), with the day and time it was recorded and how far from the report ("30 min avant le rapport";
  Entretien, which has a day and no time, uses noon: "avant midi"). Typed values and web values with the feels-like
  and wind direction; airport estimates marked "≈" with a note. NOTHING is copied into the report. A line says so when
  no reading is within 12 h. `js/services/weather-context.js` (`WeatherContext.attach(container, date)`), one line in
  each of the four pages. **The admin switch** is on Météo > Admin ("Afficher la météo dans les rapports", every
  admin; stored in `weather_settings/config` as `showInReports`): off = nothing added and no reading is read. ON when
  never set. Reads are limited: the switch is remembered 10 minutes in the browser (a change reaches the others within
  10 minutes), a reading looked up for a report time is not looked up again during the visit. Any failure (rules not
  published, offline) shows nothing and the report opens as before. Not done on purpose: the report FORMS (new
  reports) - the weather is for looking at a report; the signalisation dashboard and the inspection dashboard popups.

- **Step 5 - Public: DONE (2026-10-09)** - `weather_public/latest` = the latest reading that has something publishable
  (typed values + the lake station's; NEVER the airport's), no names, rewritten by the app after every save,
  correction or deletion (also after the Admin "delete old" tool) with `WeatherService.publishLatest`; removed when
  nothing is left. Fields fixed by the rules (`locationId, locationName, recordedAt, measures, webFields,
  attribution, updatedAt`; `measures` limited to the 13 known keys). If the public copy cannot be written the reading
  is still saved and the toast says so. The public status page shows a live weather panel above the map (hidden when
  there is no reading or on any error, never touching the trail map; "(ancien)" and dimmed after 36 h; always the day
  and time of the reading; credit to Environment Canada when its values are used). Also fixed: the entry page's
  notices used a function that shows nothing there; they are now toasts like the other report pages.
  **For the Mont Orford website** (`js/services/weather-public.js`, stand-alone, can simply be copied):
  - address (no key, no login, once the rules are published):
    `https://firestore.googleapis.com/v1/projects/trail-inspection/databases/(default)/documents/weather_public/latest`
    (Firestore's typed JSON; 404 = no reading published). `WeatherPublic.fromRest()` turns it into
    `{ locationName, recordedAt (ISO), measures: { tempC, feelsLikeC, windKmh, windDir, gustKmh, rainMm, newSnowCm,
    snowDepthCm, cloudCover, sky, visibilityKm, humidityPct, pressureKpa }, webFields, attribution }`.
  - ready-made panel: `<div id="w"></div> <script src="weather-public.js"></script> <script>
    WeatherPublic.injectStyles(); WeatherPublic.fetchLatest('trail-inspection').then(p => { if (p) w.innerHTML =
    WeatherPublic.panelHtml(p, { icon: '❄️' }); });</script>`
  - to verify on the real site once the rules are published: the address answers from another website (CORS).
  - the "show weather in reports" toggle is NOT for this panel: the public screen always shows the latest reading.

- **Step 4 - Admin: DONE (2026-10-09)** - `pages/meteo-stats.html` (nav entry "Admin", admins only) on the shared engine
  (`js/admin/data-admin.js`: new optional `series` chart kind, `orphanApp` optional, `deleteOld.scope/description`;
  the other three Admin pages are unchanged). Statistiques by season of the activity chosen in the header: 8 cards
  (readings, days with a reading out of the days so far, mean / coldest / warmest day, cumulated fresh snow, max snow
  at the base, days without a reading in the last 20 - ending YESTERDAY, today is not over), 3 charts (temperature
  line, fresh-snow bars, snow-at-base line; ONE value per day = the reading closest to noon that has that measure),
  and a ranking of who entered readings. Gestion des données (system admin): overview, delete old readings (both
  seasons) with an automatic JSON backup; no orphan tool (no photos). A single reading is deleted from the entry
  page by the system admin only. No separate "Gestion" page: readings are already listed and corrected on the entry
  page (can be added if wanted).

- **Step 3 - Entry page: DONE (2026-10-09)** - `pages/meteo-report.html`: date and time (default now), place,
  a button "Charger les données d'Environnement Canada" (by hand; reads the stations for the CHOSEN time), 13
  measures each with the web value + its station and observation time beside a BLANK typed input, a "↺" to take back
  a typed value, a comment, save. Errors named per field; nothing typed and nothing loaded is refused; if
  Environment Canada is down the form still works by hand. A list of the day's readings (◀ ▶ / date / today) shows
  the effective value of each with ✎ typed / 🌐 web, who entered it, and "Modifier" (the web values are kept as
  read, the author never changes, the editor is recorded). Times are shown the Quebec way ("12 h 00").
  Not in this step: delete (system admin, with the Gestion page in step 4).

- **Step 2 - Data and web values: DONE (2026-10-09)** - `js/services/weather-service.js` + `APP_CONFIG.weather`
  (place, the two stations, publish flags, 3 h window). Record in `weather_records`: `locationId`, `recordedAt`,
  `manual {13 fields, null = not typed}`, `web {fetchedAt, fields {value, source, observedAt, publishable}}`,
  `comment`, author / editor fields. Web values come from the first station that has them (lake first, airport
  after); feels-like computed (wind chill / humidex, Environment Canada formulas); a typed value wins and can be
  undone; `effectiveValues(record, {publicOnly})` drops the airport's values. The list query uses only
  `recordedAt` (no composite index). Checked live against Environment Canada (now, yesterday, 45 days ago).
  Units: °C, km/h, mm, cm, %, kPa, km (confirmed by the data). Rain = the 24 h precipitation, offered only above
  +1 °C; the cloud / sky / airport hints are approximations (labelled as hints in the form, step 3).

- **Step 1 - Foundation: DONE (2026-10-09)** - permission `allowMeteo` (user form, list badge, CSV import/export and
  template); portal tile `meteo` with the season symbol (`weatherIcon` per activity in `config.js`,
  `Network.seasonIcon()`); yellow module colour (`--color-meteo`, `data-module="meteo"`); `pages/meteo-report.html`
  as a shell with its access check and navigation (nav set `meteo`); rules for `weather_records`,
  `weather_public/latest` and `weather_settings` (to republish). The "Gestion" and "Admin" navigation entries
  come with their pages (step 4), so no dead entry is shown meanwhile.

### 2026-10-10 - the customer's own sheet (Force des vents, Conditions de neige, Fond, Couverture)
Four fields typed by hand only (Environment Canada gives none of them) were added to what exists, in the customer's priority order: temperature, felt, **wind force**, wind, gusts, direction, new snow, **snow conditions**, snow depth (cm, kept), **fond**, **couverture**, rain, clouds, conditions, humidity, pressure, visibility. Their choices are in config.js (APP_CONFIG.weather.lists: the id is stored, the words can be changed); they go to the public page and the other website as words. The Firestore rules (weather_public measures) had to be republished.
