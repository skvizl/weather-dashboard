function coordinateId(latitude, longitude) {
  return -(Math.round((latitude + 90) * 100) * 36001 + Math.round((longitude + 180) * 100) + 1)
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/location') {
      if (request.method !== 'GET') {
        return json({ error: 'This location request must use GET.' }, 405)
      }

      const location = request.cf ?? {}
      const latitude = Number(location.latitude)
      const longitude = Number(location.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return json({ error: 'Cloudflare could not estimate your location. Search for a city instead.' }, 503)
      }

      const name = location.city || location.region || location.country || 'Approximate location'
      const region = location.region && location.region !== name ? location.region : undefined
      return json({
        place: {
          id: coordinateId(latitude, longitude),
          name,
          latitude,
          longitude,
          admin1: region,
          country: location.country,
          timezone: 'auto',
          source: 'ip',
        },
      })
    }

    return env.ASSETS.fetch(request)
  },
}

