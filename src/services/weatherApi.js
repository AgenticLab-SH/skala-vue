import axios from 'axios'

import { koreaWeatherGrid } from '../data/koreaWeatherGrid'

const openMeteoApi = axios.create({ baseURL: 'https://api.open-meteo.com', timeout: 10000 })
const sunTimesApi = axios.create({ baseURL: 'https://api.sunrisesunset.io', timeout: 10000 })

const weatherCache = new Map()
let weatherGridCache = null
let openWeatherSnapshotPromise = null
const CACHE_TIME = 10 * 60 * 1000

const openMeteoConditions = {
  0: '맑음',
  1: '대체로 맑음',
  2: '구름 조금',
  3: '흐림',
  45: '안개',
  48: '서리 안개',
  51: '약한 이슬비',
  53: '이슬비',
  55: '강한 이슬비',
  56: '약한 어는 이슬비',
  57: '강한 어는 이슬비',
  61: '약한 비',
  63: '비',
  65: '강한 비',
  66: '약한 어는 비',
  67: '강한 어는 비',
  71: '약한 눈',
  73: '눈',
  75: '강한 눈',
  77: '싸락눈',
  80: '약한 소나기',
  81: '소나기',
  82: '강한 소나기',
  85: '약한 눈 소나기',
  86: '강한 눈 소나기',
  95: '뇌우',
  96: '우박을 동반한 뇌우',
  99: '강한 우박과 뇌우',
}

const rainWeatherCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
const snowWeatherCodes = new Set([71, 73, 75, 77, 85, 86])
const fogWeatherCodes = new Set([45, 48])

export class LiveWeatherApiError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

async function requestOpenWeatherSnapshot() {
  if (!openWeatherSnapshotPromise) {
    const snapshotUrl = `${import.meta.env.BASE_URL}data/openweather.json`
    openWeatherSnapshotPromise = axios
      .get(snapshotUrl, { timeout: 10000 })
      .then(({ data }) => {
        if (data?.source !== 'OpenWeather' || !data.generatedAt || !data.cities) {
          throw new LiveWeatherApiError('OPENWEATHER_SNAPSHOT_INVALID')
        }
        return data
      })
      .catch((error) => {
        openWeatherSnapshotPromise = null
        throw error
      })
  }
  return openWeatherSnapshotPromise
}

async function requestOpenMeteoBundle(city) {
  const response = await openMeteoApi.get('/v1/forecast', {
    params: {
      latitude: city.latitude,
      longitude: city.longitude,
      current: 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m',
      hourly:
        'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m',
      forecast_days: 5,
      timezone: 'Asia/Seoul',
    },
  })
  const data = response.data
  const forecast = data.hourly.time.map((time, index) => ({
    time,
    temperature: data.hourly.temperature_2m[index],
    condition: openMeteoConditions[data.hourly.weather_code[index]] ?? '날씨 변화',
    humidity: data.hourly.relative_humidity_2m[index],
    windSpeed: Number((data.hourly.wind_speed_10m[index] / 3.6).toFixed(1)),
    precipitationProbability: data.hourly.precipitation_probability[index] ?? 0,
  }))
  const nearestForecast = findNearestForecast({ forecast }, data.current.time)

  return {
    cityId: city.id,
    cityName: city.name,
    source: 'Open-Meteo',
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      condition: openMeteoConditions[data.current.weather_code] ?? '날씨 변화',
      humidity: data.current.relative_humidity_2m,
      windSpeed: Number((data.current.wind_speed_10m / 3.6).toFixed(1)),
      precipitationProbability: nearestForecast?.precipitationProbability ?? null,
    },
    forecast,
  }
}

export async function requestWeatherBundle(city, { force = false } = {}) {
  const cacheKey = city.id
  const cached = weatherCache.get(cacheKey)
  if (!force && cached && Date.now() - cached.savedAt < CACHE_TIME) {
    return { ...cached.value, cacheStatus: 'cached' }
  }

  try {
    let response
    let fetchedAt
    try {
      // 배포 단계에서 키로 만든 데이터만 읽어 브라우저 번들에는 키를 남기지 않습니다.
      const snapshot = await requestOpenWeatherSnapshot()
      response = snapshot.cities[city.id]
      if (!response) throw new LiveWeatherApiError('OPENWEATHER_CITY_MISSING')
      fetchedAt = snapshot.generatedAt
    } catch {
      // 스냅샷이 아직 없거나 갱신에 실패해도 추천 흐름은 계속 사용할 수 있게 둡니다.
      response = await requestOpenMeteoBundle(city)
      fetchedAt = new Date().toISOString()
    }
    const value = {
      ...response,
      fetchedAt,
      cacheStatus: 'fresh',
    }
    weatherCache.set(cacheKey, { savedAt: Date.now(), value })
    return value
  } catch {
    throw new LiveWeatherApiError('WEATHER_REQUEST_FAILED')
  }
}

function normalizeWeatherGridPoint(point, response) {
  const current = response.current ?? {}
  const weatherCode = current.weather_code
  const rainAmount = Number(((current.rain ?? 0) + (current.showers ?? 0)).toFixed(1))
  const snowfall = Number((current.snowfall ?? 0).toFixed(1))
  const cloudCover = Math.round(current.cloud_cover ?? 0)
  const isRaining = rainAmount > 0 || rainWeatherCodes.has(weatherCode)
  const isSnowing = snowfall > 0 || snowWeatherCodes.has(weatherCode)
  const isFoggy = fogWeatherCodes.has(weatherCode)
  const isCloudy =
    cloudCover >= 65 || weatherCode === 2 || weatherCode === 3 || isFoggy || isRaining || isSnowing
  const kind = isRaining
    ? 'rain'
    : isSnowing
      ? 'snow'
      : isFoggy
        ? 'fog'
        : isCloudy
          ? 'cloud'
          : 'clear'

  return {
    ...point,
    time: current.time,
    temperature: current.temperature_2m,
    condition: openMeteoConditions[weatherCode] ?? '날씨 변화',
    weatherCode,
    precipitation: Number((current.precipitation ?? 0).toFixed(1)),
    rainAmount,
    snowfall,
    cloudCover,
    windSpeed: Number(((current.wind_speed_10m ?? 0) / 3.6).toFixed(1)),
    isRaining,
    isCloudy,
    kind,
  }
}

export async function requestKoreaWeatherGrid({ force = false } = {}) {
  if (!force && weatherGridCache && Date.now() - weatherGridCache.savedAt < CACHE_TIME) {
    return { ...weatherGridCache.value, cacheStatus: 'cached' }
  }

  try {
    const batchSize = 36
    const batches = Array.from(
      { length: Math.ceil(koreaWeatherGrid.length / batchSize) },
      (_, index) => koreaWeatherGrid.slice(index * batchSize, (index + 1) * batchSize),
    )
    const batchResults = await Promise.allSettled(
      batches.map(async (points) => {
        const response = await openMeteoApi.get('/v1/forecast', {
          params: {
            latitude: points.map((point) => point.latitude).join(','),
            longitude: points.map((point) => point.longitude).join(','),
            current:
              'temperature_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m',
            timezone: 'Asia/Seoul',
            forecast_days: 1,
          },
        })
        const responses = Array.isArray(response.data) ? response.data : [response.data]
        if (responses.length !== points.length) {
          throw new LiveWeatherApiError('WEATHER_GRID_INCOMPLETE')
        }
        return points.map((point, index) => normalizeWeatherGridPoint(point, responses[index]))
      }),
    )
    const points = batchResults.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )
    if (!points.length) {
      throw new LiveWeatherApiError('WEATHER_GRID_INCOMPLETE')
    }

    const value = {
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
      points,
      totalPointCount: koreaWeatherGrid.length,
      partial: points.length !== koreaWeatherGrid.length,
      cacheStatus: 'fresh',
    }
    weatherGridCache = { savedAt: Date.now(), value }
    return value
  } catch (error) {
    if (error instanceof LiveWeatherApiError) throw error
    throw new LiveWeatherApiError('WEATHER_GRID_REQUEST_FAILED')
  }
}

export function findNearestForecast(bundle, targetDate) {
  const targetTime = new Date(targetDate).getTime()
  return bundle.forecast.reduce((nearest, item) => {
    const gap = Math.abs(new Date(item.time).getTime() - targetTime)
    return !nearest || gap < nearest.gap ? { ...item, gap } : nearest
  }, null)
}

export async function requestLiveWeather(cityName) {
  try {
    const snapshot = await requestOpenWeatherSnapshot()
    const bundle = Object.values(snapshot.cities).find(
      (item) => item.cityName === cityName || item.cityId === cityName.toLowerCase(),
    )
    if (!bundle) throw new LiveWeatherApiError('LOCATION_NOT_FOUND')
    const weather = bundle.current
    return {
      cityName: bundle.cityName,
      temperature: weather.temperature,
      condition: weather.condition,
      humidity: weather.humidity,
    }
  } catch (error) {
    if (error instanceof LiveWeatherApiError) throw error
    throw new LiveWeatherApiError('WEATHER_REQUEST_FAILED')
  }
}

export async function requestSunTimes({ latitude, longitude }) {
  try {
    const response = await sunTimesApi.get('/json', {
      params: { lat: latitude, lng: longitude, timezone: 'Asia/Seoul', time_format: 24 },
    })
    return { sunrise: response.data.results.sunrise, sunset: response.data.results.sunset }
  } catch {
    throw new LiveWeatherApiError('SUN_TIMES_REQUEST_FAILED')
  }
}
