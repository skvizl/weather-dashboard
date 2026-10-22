export type Units = 'metric' | 'imperial'

export type Place = {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  timezone?: string
}

export function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 97, 99].includes(code)) return 'Thunderstorm'
  return 'Conditions unavailable'
}

export function placeLabel(place: Place): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

export function forecastParams(place: Place, units: Units): URLSearchParams {
  return new URLSearchParams({
    latitude: String(place.latitude), longitude: String(place.longitude),
    current: 'temperature_2m,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    forecast_days: '7', timezone: place.timezone || 'auto',
    temperature_unit: units === 'metric' ? 'celsius' : 'fahrenheit',
    wind_speed_unit: units === 'metric' ? 'kmh' : 'mph',
  })
}

export function formatHourlyTime(time: string, units: Units): string {
  // Forecast timestamps are already expressed in the selected location's time zone.
  const date = new Date(`${time}Z`)
  if (units === 'metric') {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' }).format(date)
}

export function formatDailyWeekday(date: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}


