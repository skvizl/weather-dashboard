import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { canSearchLocation, formatDailyWeekday, formatHourlyTime, forecastParams, LOCATION_SEARCH_MIN_LENGTH, placeLabel } from './weather-utils'
import type { Place, Units } from './weather-utils'
import WeatherIcon from './WeatherIcon'
import './App.css'

type WeatherPayload = {
  current: { time: string; temperature_2m: number; weather_code: number; wind_speed_10m: number }
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[]; wind_speed_10m: number[] }
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; wind_speed_10m_max: number[] }
  current_units: { temperature_2m: string; wind_speed_10m: string }
  hourly_units: { temperature_2m: string; wind_speed_10m: string }
  daily_units: { temperature_2m_max: string; wind_speed_10m_max: string }
}
type Theme = 'system' | 'light' | 'dark'
type ChartMetric = 'rain' | 'wind'

const SAVED_KEY = 'weather-dashboard.saved-locations'
const LAST_KEY = 'weather-dashboard.last-location'
const UNITS_KEY = 'weather-dashboard.units'
const THEME_KEY = 'weather-dashboard.theme'

function readSaved(): Place[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as Place[] } catch { return [] }
}

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function App() {
  const [saved, setSaved] = useState<Place[]>(readSaved)
  const [selected, setSelected] = useState<Place | null>(() => {
    try { return JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') as Place | null } catch { return null }
  })
  const [units, setUnits] = useState<Units>(() => localStorage.getItem(UNITS_KEY) === 'imperial' ? 'imperial' : 'metric')
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [weather, setWeather] = useState<WeatherPayload | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [showQrCode, setShowQrCode] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('rain')

  useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)) }, [saved])
  useEffect(() => { localStorage.setItem(UNITS_KEY, units) }, [units])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])
  useEffect(() => {
    if (!menuOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])
  useEffect(() => {
    if (selected) localStorage.setItem(LAST_KEY, JSON.stringify(selected))
  }, [selected])

  useEffect(() => {
    if (!showQrCode) return
    let active = true
    QRCode.toDataURL(window.location.href, { width: 220, margin: 2, errorCorrectionLevel: 'M' })
      .then(dataUrl => { if (active) setQrCode(dataUrl) })
      .catch(() => { if (active) setQrCode('') })
    return () => { active = false }
  }, [showQrCode])

  useEffect(() => {
    const term = query.trim()
    if (!canSearchLocation(term)) return

    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const params = new URLSearchParams({ name: term, count: '10', language: 'en', format: 'json' })
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Location search is temporarily unavailable.')
        const data = await response.json() as { results?: Place[] }
        if (!active) return
        setResults(data.results ?? [])
        if (!data.results?.length) setSearchError('No matching places found. Try adding a country or region.')
      } catch (reason) {
        if (!active || (reason instanceof DOMException && reason.name === 'AbortError')) return
        setResults([])
        setSearchError(reason instanceof Error ? reason.message : 'Could not search for that location.')
      } finally {
        if (active) setSearching(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    const params = forecastParams(selected, units)
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Weather data is temporarily unavailable. Please try again.')
        return response.json() as Promise<WeatherPayload>
      })
      .then(setWeather)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setWeather(null)
        setError(reason instanceof Error ? reason.message : 'Could not load weather data.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [selected, units])

  function updateQuery(value: string) {
    setQuery(value)
    setResults([])
    setSearching(false)
    setSearchError('')
  }

  function choosePlace(place: Place) {
    setSelectedDate(null)
    if (selected?.id === place.id) { updateQuery(''); return }
    setSelected(place); setLoading(true); setError(''); updateQuery('')
  }

  function useCurrentLocation() {
    setLocationError('')
    setGettingLocation(true)
    fetch('/api/location')
      .then(async response => {
        const data = await response.json().catch(() => ({})) as { place?: Place; error?: string }
        if (!response.ok || !data.place) {
          throw new Error(data.error || 'Approximate location is unavailable here. Search for a city instead.')
        }
        return data.place
      })
      .then(place => {
        choosePlace(place)
      })
      .catch((reason: unknown) => {
        setLocationError(reason instanceof Error ? reason.message : 'Could not estimate your location. Search for a city instead.')
      })
      .finally(() => setGettingLocation(false))
  }

  function changeUnits(value: Units) {
    if (value === units) return
    setUnits(value)
    setLoading(true)
    setError('')
  }

  function toggleSaved(place: Place) {
    setSaved(current => current.some(item => item.id === place.id)
      ? current.filter(item => item.id !== place.id)
      : [...current, place])
  }

  const currentIndex = weather?.hourly.time.findIndex(time => time >= weather.current.time) ?? -1
  const hourlyStart = Math.max(0, currentIndex)
  const hourly = weather ? weather.hourly.time.slice(hourlyStart, hourlyStart + 24).map((time, offset) => {
    const index = hourlyStart + offset
    return { time, temperature: weather.hourly.temperature_2m[index], code: weather.hourly.weather_code[index], rain: weather.hourly.precipitation_probability[index], wind: weather.hourly.wind_speed_10m[index] }
  }) : []

  const isSaved = selected ? saved.some(item => item.id === selected.id) : false
  const windUnit = units === 'metric' ? 'km/h' : 'mph'

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Weather dashboard home">Weather</a>
        <div className="top-actions">
          {saved.length > 0 && <label className="location-picker"><span className="sr-only">Saved locations</span><select value={selected?.id ?? ''} onChange={event => { const place = saved.find(item => item.id === Number(event.target.value)); if (place) choosePlace(place) }}><option value="">Saved locations</option>{saved.map(place => <option key={place.id} value={place.id}>{placeLabel(place)}</option>)}</select></label>}
          <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close settings menu' : 'Open settings menu'} aria-expanded={menuOpen} aria-controls="header-settings" onClick={() => setMenuOpen(open => !open)}><span className="menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
          <div className={`settings-controls${menuOpen ? ' is-open' : ''}`} id="header-settings" aria-label="App settings">
            <button className="qr-toggle" type="button" aria-expanded={showQrCode} aria-controls="share-qr" onClick={() => { setShowQrCode(open => !open); setMenuOpen(false) }}>{showQrCode ? 'Hide QR code' : 'Open on phone'}</button>
            <label className="theme-picker"><span className="sr-only">Appearance</span><select value={theme} onChange={event => { setTheme(event.target.value as Theme); setMenuOpen(false) }} aria-label="Appearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
            <div className="unit-switch" aria-label="Temperature units" role="group"><button className={units === 'metric' ? 'active' : ''} onClick={() => { changeUnits('metric'); setMenuOpen(false) }} aria-pressed={units === 'metric'}>°C</button><button className={units === 'imperial' ? 'active' : ''} onClick={() => { changeUnits('imperial'); setMenuOpen(false) }} aria-pressed={units === 'imperial'}>°F</button></div>
          </div>
        </div>
      </header>

      {showQrCode && <section className="qr-panel" id="share-qr" aria-label="Open this app on your phone">
        <div><h2>Open this app on your phone</h2><p>Scan this code with your phone camera.</p><p className="qr-url">{window.location.href}</p></div>
        {qrCode ? <img src={qrCode} width="176" height="176" alt="QR code for this app address" /> : <p className="qr-status" role="status">Creating QR code…</p>}
      </section>}

      {!selected ? (
        <section className="welcome-card" id="home">
          <p className="eyebrow">Local forecast</p><h1>Choose a location</h1><p className="intro">Search for a city or postal code to see its weather.</p>
          <CurrentLocationAction onClick={useCurrentLocation} loading={gettingLocation} error={locationError} />
          <SearchForm query={query} setQuery={updateQuery} searching={searching} error={searchError} resultCount={results.length} />
          <Results results={results} onChoose={choosePlace} />
        </section>
      ) : (
        <>
          <section className="location-heading">
            <div><p className="eyebrow">Your forecast</p><h1>{selected.name}</h1><p className="subheading">{[selected.admin1, selected.country].filter(Boolean).join(', ')}</p>{selected.source === 'ip' && <p className="location-note">Approximate location based on your internet connection.</p>}</div>
            <button className="text-button" onClick={() => { setSelected(null); setWeather(null); setSearching(false) }} aria-label="Search for another location">Change location</button>
          </section>
          <section className="search-panel" aria-label="Search locations"><CurrentLocationAction onClick={useCurrentLocation} loading={gettingLocation} error={locationError} /><SearchForm query={query} setQuery={updateQuery} searching={searching} error={searchError} resultCount={results.length} /><Results results={results} onChoose={choosePlace} /></section>
          {loading && <p className="status-message" role="status">Loading forecast…</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          {weather && !loading && <>
            <section className="current-card" aria-labelledby="current-title">
              <div><p className="eyebrow" id="current-title">Current conditions</p><div className="current-condition"><WeatherIcon code={weather.current.weather_code} size={54} /></div><p className="current-wind">Wind {Math.round(weather.current.wind_speed_10m)} {windUnit}</p></div>
              <div className="current-temperature">{Math.round(weather.current.temperature_2m)}<span>{weather.current_units.temperature_2m}</span></div>
            </section>
            <section className="forecast-section" aria-labelledby="hourly-title"><div className="section-heading"><div><p className="eyebrow">Coming up</p><h2 id="hourly-title">Next 24 hours</h2></div></div>
              <div className="hourly-strip" tabIndex={0} aria-label="Hourly forecast, scroll horizontally for more">
                {hourly.map(item => <article className="hour-card" key={item.time}><p className="hour-time">{formatHourlyTime(item.time, units)}</p><p className="hour-temp">{Math.round(item.temperature)}{weather.hourly_units.temperature_2m}</p><p className="hour-condition"><WeatherIcon code={item.code} size={34} /></p>{item.rain > 0 && <p className="rain-probability">Rain {item.rain}%</p>}<p className="hour-wind">Wind {Math.round(item.wind)} {windUnit}</p></article>)}
              </div>
            </section>
            <section className="forecast-section" aria-labelledby="daily-title"><div className="section-heading"><div><p className="eyebrow">Plan ahead</p><h2 id="daily-title">7-day forecast</h2></div></div>
              <div className="daily-list">{weather.daily.time.map((date, index) => {
                const daySelected = date === selectedDate
                const currentDate = weather.current.time.slice(0, 10)
                const dayHours = daySelected ? weather.hourly.time.flatMap((time, hourIndex) => {
                  if (time.slice(0, 10) !== date || (date === currentDate && time < weather.current.time)) return []
                  return [{ time, temperature: weather.hourly.temperature_2m[hourIndex], code: weather.hourly.weather_code[hourIndex], rain: weather.hourly.precipitation_probability[hourIndex], wind: weather.hourly.wind_speed_10m[hourIndex] }]
                }) : []
                return <div className="daily-entry" key={date}>
                  <button className="daily-row" type="button" aria-expanded={daySelected} aria-controls={`day-detail-${date}`} onClick={() => setSelectedDate(daySelected ? null : date)}>
                    <span className="day-name">{index === 0 ? 'Today' : formatDailyWeekday(date)}</span><span className="day-condition"><WeatherIcon code={weather.daily.weather_code[index]} size={30} />{weather.daily.precipitation_probability_max[index] > 0 && <span className="day-rain">Rain {weather.daily.precipitation_probability_max[index]}%</span>}</span><span className="day-wind">Wind {Math.round(weather.daily.wind_speed_10m_max[index])} {windUnit}</span><span className="day-temperature"><span>{Math.round(weather.daily.temperature_2m_max[index])}°</span><span className="low">{Math.round(weather.daily.temperature_2m_min[index])}°</span></span>
                  </button>
                  {daySelected && <DayDetail id={`day-detail-${date}`} date={date} hours={dayHours} units={units} windUnit={windUnit} metric={chartMetric} setMetric={setChartMetric} />}
                </div>
              })}</div>
            </section>
            <footer className="app-footer"><button className="text-button" onClick={() => selected && toggleSaved(selected)}>{isSaved ? 'Remove saved location' : 'Save this location'}</button><p>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></p></footer>
          </>}
        </>
      )}
      <footer className="site-footer">Weather forecasts are estimates and may change.</footer>
    </main>
  )
}

function CurrentLocationAction({ onClick, loading, error }: { onClick: () => void; loading: boolean; error: string }) {
  return <div className="current-location-action">
    <button className="location-action-button" type="button" onClick={onClick} disabled={loading}>{loading ? 'Finding your location…' : 'Use my current location'}</button>
    {error && <p className="location-action-error" role="alert">{error}</p>}
  </div>
}

type DayHour = { time: string; temperature: number; code: number; rain: number; wind: number }

function DayDetail({ id, date, hours, units, windUnit, metric, setMetric }: { id: string; date: string; hours: DayHour[]; units: Units; windUnit: string; metric: ChartMetric; setMetric: (metric: ChartMetric) => void }) {
  const maxWind = Math.max(1, ...hours.map(hour => hour.wind))
  const chartMax = metric === 'rain' ? 100 : Math.ceil(maxWind / 5) * 5
  const chartUnit = metric === 'rain' ? '%' : windUnit
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))

  return <section className="day-detail" id={id} aria-label={`Detailed forecast for ${dateLabel}`}>
    <h3>{dateLabel}</h3>
    <div className="day-detail-heading"><h4>Hourly forecast</h4><div className="chart-toggle" role="group" aria-label="Choose chart data">
      <button type="button" aria-pressed={metric === 'rain'} onClick={() => setMetric('rain')}>Rain chance</button>
      <button type="button" aria-pressed={metric === 'wind'} onClick={() => setMetric('wind')}>Wind speed</button>
    </div></div>
    {hours.length ? <>
      <div className="detail-hourly-strip" aria-label={`Hourly forecast for ${dateLabel}`}>
        {hours.map(hour => <article className="detail-hour" key={hour.time}>
          <p>{formatHourlyTime(hour.time, units)}</p><WeatherIcon code={hour.code} size={28} /><strong>{Math.round(hour.temperature)}°</strong>
          {hour.rain > 0 && <span>Rain {Math.round(hour.rain)}%</span>}<span>Wind {Math.round(hour.wind)} {windUnit}</span>
        </article>)}
      </div>
      <div className="chart-heading"><p>{metric === 'rain' ? 'Chance of rain' : 'Wind speed'}</p><span>{chartUnit}</span></div>
      <div className="forecast-chart" role="img" aria-label={`Hourly ${metric === 'rain' ? 'rain chance' : 'wind speed'} chart for ${dateLabel}`}>
        <div className="chart-axis" aria-hidden="true"><span>{chartMax}{chartUnit}</span><span>{Math.round(chartMax / 2)}{chartUnit}</span><span>0</span></div>
        <div className="chart-scroll"><div className="chart-columns">
          {hours.map((hour, index) => {
            const value = metric === 'rain' ? hour.rain : hour.wind
            const barHeight = chartMax ? Math.min(100, Math.max(0, value / chartMax * 100)) : 0
            const valueLabel = metric === 'rain' ? `${Math.round(value)}%` : `${Math.round(value)} ${windUnit}`
            return <div className="chart-column" key={hour.time} title={`${formatHourlyTime(hour.time, units)} · ${valueLabel}`}>
              <span className="chart-bar-space"><span className={`chart-bar ${metric === 'wind' ? 'wind' : ''}`} style={{ height: `${barHeight}%` }} /></span>
              <span className="chart-time">{index % 3 === 0 || index === hours.length - 1 ? formatHourlyTime(hour.time, units) : ''}</span>
            </div>
          })}
        </div></div>
      </div>
      <ul className="sr-only">{hours.map(hour => <li key={hour.time}>{formatHourlyTime(hour.time, units)}: {metric === 'rain' ? `rain chance ${Math.round(hour.rain)} percent` : `wind speed ${Math.round(hour.wind)} ${windUnit}`}</li>)}</ul>
    </> : <p className="status-message">No hourly forecast is available for this day.</p>}
  </section>
}

function SearchForm({ query, setQuery, searching, error, resultCount }: { query: string; setQuery: (value: string) => void; searching: boolean; error: string; resultCount: number }) {
  const tooShort = !canSearchLocation(query)
  return <div className="search-form"><label className="sr-only" htmlFor="location-search">Search city or postal code</label><input id="location-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search city or postal code" autoComplete="off" aria-controls={resultCount ? 'location-results' : undefined} aria-expanded={resultCount > 0}/>{searching ? <p className="search-status" role="status">Searching…</p> : error ? <p className="inline-error" role="status">{error}</p> : resultCount ? <p className="search-status" role="status">{resultCount} location suggestions found.</p> : tooShort ? <p className="search-hint">Type at least {LOCATION_SEARCH_MIN_LENGTH} characters to see suggestions.</p> : null}</div>
}

function Results({ results, onChoose }: { results: Place[]; onChoose: (place: Place) => void }) {
  if (!results.length) return null
  return <ul className="results-list" id="location-results" aria-label="Location search suggestions">{results.map(place => <li key={place.id}><button onClick={() => onChoose(place)}>{placeLabel(place)}<span>Select</span></button></li>)}</ul>
}

export default App












