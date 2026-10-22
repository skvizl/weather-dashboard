import { describe, expect, it } from 'vitest'
import { formatDailyWeekday, formatHourlyTime, forecastParams, placeLabel, weatherDescription } from './weather-utils'
import type { Place } from './weather-utils'

const zagreb: Place = { id: 1, name: 'Zagreb', admin1: 'City of Zagreb', country: 'Croatia', latitude: 45.81, longitude: 15.98, timezone: 'Europe/Zagreb' }

describe('weather display helpers', () => {
  it('maps Open-Meteo weather codes to plain-language conditions', () => {
    expect(weatherDescription(0)).toBe('Clear sky')
    expect(weatherDescription(3)).toBe('Overcast')
    expect(weatherDescription(61)).toBe('Rain')
    expect(weatherDescription(95)).toBe('Thunderstorm')
    expect(weatherDescription(-1)).toBe('Conditions unavailable')
  })

  it('formats location labels with region and country context', () => {
    expect(placeLabel(zagreb)).toBe('Zagreb, City of Zagreb, Croatia')
  })

  it('requests the MVP fields, seven days, and metric units', () => {
    const params = forecastParams(zagreb, 'metric')
    expect(params.get('forecast_days')).toBe('7')
    expect(params.get('current')).toContain('weather_code')
    expect(params.get('hourly')).toContain('precipitation_probability')
    expect(params.get('daily')).toContain('temperature_2m_max')
    expect(params.get('temperature_unit')).toBe('celsius')
    expect(params.get('wind_speed_unit')).toBe('kmh')
    expect(params.get('timezone')).toBe('Europe/Zagreb')
  })

  it('requests imperial values when selected', () => {
    const params = forecastParams(zagreb, 'imperial')
    expect(params.get('temperature_unit')).toBe('fahrenheit')
    expect(params.get('wind_speed_unit')).toBe('mph')
  })

  it('formats hourly timestamps in the selected location time zone', () => {
    expect(formatHourlyTime('2026-10-22T14:00', 'metric')).toBe('14:00')
  })

  it('formats daily weekday labels without shifting the forecast date', () => {
    expect(formatDailyWeekday('2026-10-22')).toBe('Thu')
  })
})


