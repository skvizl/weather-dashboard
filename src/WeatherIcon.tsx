import { weatherDescription, weatherIconKind } from './weather-utils'

type WeatherIconProps = { code: number; size?: number }

export default function WeatherIcon({ code, size = 40 }: WeatherIconProps) {
  const kind = weatherIconKind(code)
  return (
    <span className={`weather-icon weather-icon-${kind}`} role="img" aria-label={weatherDescription(code)}>
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" fill="none">
        {kind === 'sun' && <>
          <circle cx="24" cy="24" r="8" fill="currentColor" />
          <path d="M24 4v5M24 39v5M4 24h5M39 24h5M9.9 9.9l3.6 3.6m21 21 3.6 3.6m0-28.2-3.6 3.6m-21 21-3.6 3.6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>}
        {kind === 'partly-cloudy' && <>
          <circle cx="29" cy="17" r="8" fill="currentColor" opacity=".9" />
          <path d="M15 35h20a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-1 16Z" fill="var(--icon-cloud-fill)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </>}
        {['cloud', 'fog', 'drizzle', 'rain', 'snow', 'thunder'].includes(kind) && <path d="M12 29h24a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-3 18Z" fill="var(--icon-cloud-fill)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />}
        {kind === 'fog' && <path d="M9 35h30M13 41h22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {kind === 'drizzle' && <path d="m18 34-2 4m11-4-2 4m11-4-2 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {kind === 'rain' && <path d="m17 34-3 7m13-7-3 7m13-7-3 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
        {kind === 'snow' && <>
          <path d="M16 35v9m-4-7 8 5m0-5-8 5m16-7v9m-4-7 8 5m0-5-8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="36" cy="37" r="1.5" fill="currentColor" />
        </>}
        {kind === 'thunder' && <path d="m27 31-8 9h7l-2 7 9-11h-7l1-5Z" fill="var(--icon-lightning)" stroke="var(--icon-lightning)" strokeLinejoin="round" />}
        {kind === 'unknown' && <>
          <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="2.5" />
          <path d="M20 19a4 4 0 1 1 7 3c-2 2-3 2-3 5m0 5v.1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>}
      </svg>
    </span>
  )
}
