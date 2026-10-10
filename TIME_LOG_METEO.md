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
| 2026-10-09 (step 4) | 2026-10-09 22:11 → 22:27 (~16m, one block: step 4 built, tested, and checked on screen) | ~7m | ~16m |
| 2026-10-09 (step 5) | 2026-10-09 22:27 → 22:42 (~16m, one block: step 5 built, tested, and checked on screen) | ~8m | ~16m |

**Running total for the Météo app: ~38m - 1h30m**

**Note:** the last row is computed up to 22:42, when this estimate was made; any further time needs a new row.

What the rows cover: the first questions to define the app and the Environment Canada feasibility check (see
`METEO_APP.md`); then step 1, the foundation: the Météo permission (user form, list badge, import / export),
the portal tile with the season's symbol, the yellow module colour, the Météo page shell with its access check
and navigation, the Firestore rules for the weather collections, and the tests (1172 checks in the whole suite). Step 2: the data layer (`js/services/weather-service.js`): the
fields and their validation, reading Environment Canada for a time, the feels-like, the record as stored (typed
and web values together), the effective / publishable values, saving and listing in Firestore, and 40 tests.
Step 3: the entry page (`pages/meteo-report.html`): date and time, Environment Canada values loaded on request
beside blank typed values, saving, the day's list with navigation, correcting a reading (web values kept as read,
"↺" to take back a typed value), the messages when something is wrong, and 33 page tests (1245 in the whole suite).
Step 4: the Admin page (`pages/meteo-stats.html`) on the shared Admin engine: the season's statistics (one value per
day closest to noon: temperature, fresh snow, snow at the base; days without a reading in the last 20), the data
management tab for the system admin (overview, delete old readings with a backup), the system admin's delete of a
single reading on the entry page, three small additions to the shared Admin engine (a day-by-day series chart, no
photo tool, wording of the delete tool), and 48 + 7 + 3 tests (1376 in the whole suite).
Step 5: the public side: the public copy of the latest reading (no names, only publishable values, rewritten after a
save, a correction or a deletion), its rules, the weather panel on the public status page (live, hidden when there is
no reading, "ancien" after 36 h), the web address and a stand-alone file for the Mont Orford website
(`js/services/weather-public.js`), the fix of the notices on the entry page (they did not show), and 41 tests (1417
in the whole suite).
