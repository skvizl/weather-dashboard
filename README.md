# Weather Dashboard

A small weather dashboard learning project built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

The app uses the Open-Meteo Forecast and Geocoding APIs directly from the browser. Search for a city or postal code and get location suggestions after three characters. The forecast shows current conditions, the next 24 hours, and seven days with weather icons. Saved locations, the last selected location, temperature units, and appearance preference are stored in this browser only. Appearance can follow the device setting or be set to light or dark mode.

## Quality checks

```sh
npm run test
npm run build
```

## Product constraints

- The free Open-Meteo API is for non-commercial use. The project must show Open-Meteo attribution.
- Recheck Open-Meteo limits, terms, caching guidance, and any Cloudflare-specific behavior before public deployment.
- The app uses a simple blue palette in light and dark themes. Historical weather, charts, backend storage, accounts, and ESP32 integration remain deferred.
- Browser support is intended to cover Chrome, Edge, Firefox, and Safari releases from the three years before release. Confirm the exact versions against the chosen stack before deployment.
