import axios from 'axios'

const openWeatherApi = axios.create({ baseURL: 'https://api.openweathermap.org', timeout: 10000 })
const openMeteoApi = axios.create({ baseURL: 'https://api.open-meteo.com', timeout: 10000 })
const sunTimesApi = axios.create({ baseURL: 'https://api.sunrisesunset.io', timeout: 10000 })

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
const weatherCache = new Map()
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
  61: '약한 비',
  63: '비',
  65: '강한 비',
  71: '약한 눈',
  73: '눈',
  75: '강한 눈',
  80: '약한 소나기',
  81: '소나기',
  82: '강한 소나기',
  95: '뇌우',
  96: '우박을 동반한 뇌우',
  99: '강한 우박과 뇌우',
}

export class LiveWeatherApiError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

export function isOpenWeatherConfigured() {
  return Boolean(apiKey)
}

function normalizeOpenWeatherCurrent(weather) {
  return {
    time: new Date(weather.dt * 1000).toISOString(),
    temperature: weather.main.temp,
    condition: weather.weather[0]?.description ?? '정보 없음',
    humidity: weather.main.humidity,
    windSpeed: weather.wind.speed,
    precipitationProbability: null,
  }
}

function normalizeOpenWeatherForecast(item) {
  return {
    time: item.dt_txt.replace(' ', 'T') + '+00:00',
    temperature: item.main.temp,
    condition: item.weather[0]?.description ?? '정보 없음',
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    precipitationProbability: Math.round((item.pop ?? 0) * 100),
  }
}

async function requestOpenWeatherBundle(city) {
  const params = {
    lat: city.latitude,
    lon: city.longitude,
    appid: apiKey,
    units: 'metric',
    lang: 'kr',
  }
  const [currentResponse, forecastResponse] = await Promise.all([
    openWeatherApi.get('/data/2.5/weather', { params }),
    openWeatherApi.get('/data/2.5/forecast', { params }),
  ])

  const forecast = forecastResponse.data.list.map(normalizeOpenWeatherForecast)
  const current = normalizeOpenWeatherCurrent(currentResponse.data)
  const nearestForecast = findNearestForecast({ forecast }, current.time)

  return {
    cityId: city.id,
    cityName: city.name,
    source: 'OpenWeather',
    current: {
      ...current,
      // 현재 강수량 유무를 확률로 바꾸지 않고, 가장 가까운 예보의 pop 값을 사용합니다.
      precipitationProbability: nearestForecast?.precipitationProbability ?? null,
    },
    forecast,
  }
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
  const cacheKey = `${city.id}:${apiKey ? 'openweather' : 'open-meteo'}`
  const cached = weatherCache.get(cacheKey)
  if (!force && cached && Date.now() - cached.savedAt < CACHE_TIME) {
    return { ...cached.value, cacheStatus: 'cached' }
  }

  try {
    // 공개 배포에서는 키를 노출하지 않고 Open-Meteo를 사용합니다.
    // 개인 키가 있는 로컬 환경에서는 수업에서 다룬 OpenWeather 현재·예보 API를 사용합니다.
    const response = apiKey
      ? await requestOpenWeatherBundle(city)
      : await requestOpenMeteoBundle(city)
    const value = {
      ...response,
      fetchedAt: new Date().toISOString(),
      cacheStatus: 'fresh',
    }
    weatherCache.set(cacheKey, { savedAt: Date.now(), value })
    return value
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new LiveWeatherApiError('INVALID_API_KEY')
    }
    throw new LiveWeatherApiError('WEATHER_REQUEST_FAILED')
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
  if (!apiKey) throw new LiveWeatherApiError('MISSING_API_KEY')
  try {
    const locationResponse = await openWeatherApi.get('/geo/1.0/direct', {
      params: { q: `${cityName},KR`, limit: 1, appid: apiKey },
    })
    const location = locationResponse.data[0]
    if (!location) throw new LiveWeatherApiError('LOCATION_NOT_FOUND')
    const weatherResponse = await openWeatherApi.get('/data/2.5/weather', {
      params: { lat: location.lat, lon: location.lon, appid: apiKey, units: 'metric', lang: 'kr' },
    })
    const weather = weatherResponse.data
    return {
      cityName: weather.name,
      temperature: weather.main.temp,
      condition: weather.weather[0]?.description ?? '정보 없음',
      humidity: weather.main.humidity,
    }
  } catch (error) {
    if (error instanceof LiveWeatherApiError) throw error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new LiveWeatherApiError('INVALID_API_KEY')
    }
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
