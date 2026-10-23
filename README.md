# Weather Dashboard

A small weather dashboard learning project built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

The app uses the Open-Meteo Forecast and Geocoding APIs directly from the browser. Search for a city or postal code and get location suggestions after three characters. The forecast shows current conditions, the next 24 hours, and seven days with weather icons. Saved locations, the last selected location, temperature units, and appearance preference are stored in this browser only. Appearance can follow the device setting or be set to light or dark mode.

On the Cloudflare deployment, “Use my current location” uses Cloudflare's approximate IP-based location in a Worker endpoint. It does not request GPS permission. IP-based location can be inaccurate, so the app shows it as approximate and still allows manual location search. The location endpoint sends `Cache-Control: no-store`. In the Vite development server, that Cloudflare-only endpoint is unavailable; use Wrangler's local Worker preview to check the endpoint behavior.

## Quality checks

```sh
npm run test
npm run build
```

## Cloudflare Workers

Build with `npm run build`, then deploy the Worker and `dist` assets with `npx wrangler deploy`. To preview the Worker locally, build first and run `npx wrangler dev`.

## Product constraints

- The free Open-Meteo API is for non-commercial use. The project must show Open-Meteo attribution.
- Recheck Open-Meteo limits, terms, caching guidance, and any Cloudflare-specific behavior before public deployment.
- The app uses a simple blue palette in light and dark themes. Historical weather, charts, backend storage, accounts, and ESP32 integration remain deferred. Device GPS with reverse geocoding is a later mobile-only change request.
- Browser support is intended to cover Chrome, Edge, Firefox, and Safari releases from the three years before release. Confirm the exact versions against the chosen stack before deployment.

