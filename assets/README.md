# Assets Folder

## Maps (`map/`)

Each activity has its own map image, set in `js/core/config.js` (`APP_CONFIG.networks.<activity>.map`).
Trail and shelter marker coordinates are pixels on that image, so keep its size stable once trails exist.

- `map/Ski-Touring_Map.png` - ski map (800x700 px)
- `map/Bike_Map_web.jpg` - bike map (1600x919 px)

The GPS calibration of each map is saved in the database (Administration > Cartes), not in the code.
- `map/Bike_Map.jpg` - full-size original of the bike map (2205x1267 px), not used by the site

## Logo

`Logo_Mont-Orford transparent.png` is the portal logo (`BRANDING.logoImage` in `js/core/config.js`).