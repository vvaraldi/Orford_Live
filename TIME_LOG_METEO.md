# Time log - Météo app (approximate, kept apart from TIME_LOG.md)

Started 2026-10-09 so that the time spent on this feature can be looked at on its own, for a possible quote
(contract art. 3.3). Same method as `TIME_LOG.md`: active chat time from the session transcript, gaps of 5 minutes
or less (and, in the last column, 10 minutes or less) counted; the time you spend writing answers, testing, or
in the Firebase / GitHub consoles is not counted.

| Estimated on | Calendar span covered | Active time (est., ≤5 min gaps) | Active time (est., ≤10 min gaps) |
|---|---|---|---|
| 2026-10-09 | 2026-10-09 20:50 → 21:15 (~25m: the request, my questions, your answers, the Environment Canada feasibility check and this record) | ~2m | ~2m |
| 2026-10-09 (step 1) | 2026-10-09 21:15 → 21:35 (~20m, one block: step 1 built, tested and checked on screen) | ~6m | ~20m |
| 2026-10-09 (step 2) | 2026-10-09 21:35 → 21:52 (~17m, one block: step 2 built, tested, and checked against the live Environment Canada service) | ~9m | ~17m |
| 2026-10-09 (step 3) | 2026-10-09 21:52 → 22:11 (~19m, one block: step 3 built, tested, and checked on screen) | ~6m | ~19m |

**Running total for the Météo app: ~23m - 58m**

**Note:** the last row is computed up to 22:11, when this estimate was made; any further time needs a new row.

What the rows cover: the first questions to define the app and the Environment Canada feasibility check (see
`METEO_APP.md`); then step 1, the foundation: the Météo permission (user form, list badge, import / export),
the portal tile with the season's symbol, the yellow module colour, the Météo page shell with its access check
and navigation, the Firestore rules for the weather collections, and the tests (1172 checks in the whole suite). Step 2: the data layer (`js/services/weather-service.js`): the
fields and their validation, reading Environment Canada for a time, the feels-like, the record as stored (typed
and web values together), the effective / publishable values, saving and listing in Firestore, and 40 tests.
Step 3: the entry page (`pages/meteo-report.html`): date and time, Environment Canada values loaded on request
beside blank typed values, saving, the day's list with navigation, correcting a reading (web values kept as read,
"↺" to take back a typed value), the messages when something is wrong, and 33 page tests (1245 in the whole suite).
