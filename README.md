# Weather Dashboard

A small weather dashboard learning project built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

The app uses the Open-Meteo Forecast and Geocoding APIs directly from the browser. Search for a city or postal code, select a result, and the app loads current conditions, the next 24 hours, and a seven-day forecast. Saved locations and the last selected location, as well as the metric/imperial preference, are stored in this browser only.

## Quality checks

```sh
npm run test
npm run build
```

## Product constraints

- The free Open-Meteo API is for non-commercial use. The project must show Open-Meteo attribution.
- Recheck Open-Meteo limits, terms, caching guidance, and any Cloudflare-specific behavior before public deployment.
- The app is intentionally text-first, light, and neutral. Weather icons, historical weather, charts, backend storage, accounts, and ESP32 integration are deferred.
- Browser support is intended to cover Chrome, Edge, Firefox, and Safari releases from the three years before release. Confirm the exact versions against the chosen stack before deployment.
