# Orford_Live
All in one app for inspection, signalisation, infraction, ...



Few elements to consider and adjust the files please :

1- error message when going in the admin page... or My profile page...

Uncaught TypeError: firebase.storage is not a function
    initFirebase https://vvaraldi.github.io/Orford_Live/js/core/auth.js:21
    <anonymous> https://vvaraldi.github.io/Orford_Live/js/core/auth.js:352

2- There was a way to import a batch of users (via a CSV). I want to keep this functaionnality

3- When not authorised I want to just to not show he card of the application vs current proposal where you grey it and make it inactive.

4- When logging on it should send you to the main page even if before you were in a different one.

5- If the screen is tall the white framed footer is not at the bottom of the screen. could it be ?



Phase 2: Inspection Module
2.1Inspection dashboardTrail/shelter status overview with map
2.2Trail report formCreate/edit trail inspections
2.3Shelter report formCreate/edit shelter inspections
2.4Inspection historyFilterable list with pagination
2.5Photo handlingUpload, compress, GPS extraction
2.6Inspection adminStatistics, data management

Phase 3: Infraction Module
3.1Infraction reportForm with QR scanner
3.2Infraction adminList, filters, archive
3.3IntegrationLink from portal, permissions

Phase 4: Signalisation Module
4.1Signalisation reportStatus/photo capture form
4.2Signalisation adminList, resolve, archive
4.3IntegrationLink from portal, permissions

Phase 5: Public Status + Polish
5.1Public status pageTrail status (no auth required)
5.2Visual enhancementsConsistent styling, animations
5.3Mobile optimizationFinal responsive testing
5.4DocumentationREADME, deployment guide

Phase 6: Migration Support
6.1Firebase rules updateIf needed for new structure
6.2User communicationGuide for switching apps
6.3Gradual rolloutRun parallel, deprecate old apps