import axios from 'axios'

import { koreaWeatherGrid } from '../data/koreaWeatherGrid'
import { weatherCities } from '../data/weatherCities'
import { normalizeWeatherBundle, normalizeWeatherCondition } from '../utils/weatherCondition'

const sunTimesApi = axios.create({ baseURL: 'https://api.sunrisesunset.io', timeout: 10000 })

const weatherCache = new Map()
let weatherGridCache = null
let openWeatherSnapshotPromise = null
const CACHE_TIME = 10 * 60 * 1000

const rainConditionPattern = /비|이슬비|소나기|뇌우|우박|rain|drizzle|shower|thunder/i
const snowConditionPattern = /눈|진눈깨비|snow|sleet/i
const fogConditionPattern = /안개|박무|연무|fog|mist|haze/i
const cloudConditionPattern = /흐림|구름|cloud|overcast/i

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

export async function requestWeatherBundle(city, { force = false } = {}) {
  const cacheKey = city.id
  const cached = weatherCache.get(cacheKey)
  if (!force && cached && Date.now() - cached.savedAt < CACHE_TIME) {
    return { ...cached.value, cacheStatus: 'cached' }
  }

  try {
    // 배포 단계에서 키로 만든 데이터만 읽어 브라우저 번들에는 키를 남기지 않습니다.
    const snapshot = await requestOpenWeatherSnapshot()
    const response = snapshot.cities[city.id]
    if (!response) throw new LiveWeatherApiError('OPENWEATHER_CITY_MISSING')
    const value = {
      ...normalizeWeatherBundle(response),
      fetchedAt: snapshot.generatedAt,
      cacheStatus: 'fresh',
    }
    weatherCache.set(cacheKey, { savedAt: Date.now(), value })
    return value
  } catch {
    throw new LiveWeatherApiError('WEATHER_REQUEST_FAILED')
  }
}

function findNearestWeatherCity(point) {
  return weatherCities.reduce((nearest, city) => {
    const latitudeGap = city.latitude - point.latitude
    const longitudeGap =
      (city.longitude - point.longitude) * Math.cos((point.latitude * Math.PI) / 180)
    const distance = latitudeGap ** 2 + longitudeGap ** 2
    return !nearest || distance < nearest.distance ? { city, distance } : nearest
  }, null)?.city
}

function normalizeOpenWeatherGridPoint(point, city, current) {
  const condition = normalizeWeatherCondition(current.condition)
  const isRaining = rainConditionPattern.test(condition)
  const isSnowing = snowConditionPattern.test(condition)
  const isFoggy = fogConditionPattern.test(condition)
  const isCloudy =
    Number(current.cloudCover ?? 0) >= 65 ||
    cloudConditionPattern.test(condition) ||
    isFoggy ||
    isRaining ||
    isSnowing
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
    temperature: current.temperature,
    condition,
    weatherCode: current.weatherCode ?? null,
    precipitation: Number(current.rainAmount ?? 0),
    rainAmount: Number(current.rainAmount ?? (isRaining ? 0.1 : 0)),
    snowfall: Number(current.snowfall ?? 0),
    cloudCover: Number(current.cloudCover ?? (isCloudy ? 70 : 20)),
    windSpeed: Number(current.windSpeed ?? 0),
    isRaining,
    isCloudy,
    kind,
    source: 'OpenWeather',
    referenceCityName: city.name,
  }
}

async function requestOpenWeatherGrid() {
  const snapshot = await requestOpenWeatherSnapshot()
  const points = koreaWeatherGrid.map((point) => {
    const city = findNearestWeatherCity(point)
    const current = snapshot.cities[city?.id]?.current
    if (!city || !current) throw new LiveWeatherApiError('OPENWEATHER_GRID_INCOMPLETE')
    return normalizeOpenWeatherGridPoint(point, city, current)
  })
  return {
    source: 'OpenWeather',
    fetchedAt: snapshot.generatedAt,
    points,
    totalPointCount: koreaWeatherGrid.length,
    partial: false,
    cacheStatus: 'fresh',
  }
}

export async function requestKoreaWeatherGrid({ force = false } = {}) {
  if (!force && weatherGridCache && Date.now() - weatherGridCache.savedAt < CACHE_TIME) {
    return { ...weatherGridCache.value, cacheStatus: 'cached' }
  }

  try {
    // 추천과 전국 지도가 같은 OpenWeather 스냅샷을 읽어 API 상태가 서로 어긋나지 않게 합니다.
    const value = await requestOpenWeatherGrid()
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
      condition: normalizeWeatherCondition(weather.condition),
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
