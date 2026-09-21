# Assets Folder

## Maps (`map/`)

The maps are listed in `js/core/config.js` (`APP_CONFIG.maps`); each kind of trail says which map it is placed on (`trailKinds`).
Trail and shelter marker coordinates are pixels on that image, so keep its size stable once trails exist.

- `map/Ski-Touring_Map.png` - ski map for the uphill (touring) trails (800x700 px)
- `map/Ski-Downhill_Map_web.jpg` - ski map for the downhill runs (1670x736 px, same size as `Ski-Downhill_Map.png`, lighter)
- `map/Ski-Downhill_Map.png` - original of the downhill map, not used by the site
- `map/Bike_Map_web.jpg` - bike map (1600x919 px)
- `map/Bike_Map.jpg` - full-size original of the bike map (2205x1267 px), not used by the site

The GPS calibration of each map is saved in the database (Administration > Cartes), not in the code.

## Logo

`Logo_Mont-Orford transparent.png` is the portal logo (`BRANDING.logoImage` in `js/core/config.js`).