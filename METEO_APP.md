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
