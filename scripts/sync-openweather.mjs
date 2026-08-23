import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const cities = [
  ['seoul', '서울', 37.5665, 126.978],
  ['suwon', '수원', 37.2636, 127.0286],
  ['changwon', '창원', 35.2281, 128.6811],
  ['busan', '부산', 35.1796, 129.0756],
  ['gangneung', '강릉', 37.7519, 128.8761],
  ['daejeon', '대전', 36.3504, 127.3845],
  ['jeonju', '전주', 35.8242, 127.148],
  ['jeju', '제주', 33.4996, 126.5312],
  ['incheon', '인천', 37.4563, 126.7052],
  ['chuncheon', '춘천', 37.8813, 127.7298],
  ['sokcho', '속초', 38.207, 128.5918],
  ['danyang', '단양', 36.9845, 128.3656],
  ['boryeong', '보령', 36.3332, 126.6128],
  ['gwangju', '광주', 35.1595, 126.8526],
  ['yeosu', '여수', 34.7604, 127.6622],
  ['daegu', '대구', 35.8714, 128.6014],
  ['gyeongju', '경주', 35.8562, 129.2247],
  ['seogwipo', '서귀포', 33.2541, 126.5601],
].map(([id, name, latitude, longitude]) => ({ id, name, latitude, longitude }))

function normalizeCurrent(data, nearestForecast) {
  return {
    time: new Date(data.dt * 1000).toISOString(),
    temperature: data.main.temp,
    condition: data.weather[0]?.description ?? '정보 없음',
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    precipitationProbability: nearestForecast?.precipitationProbability ?? null,
  }
}

function normalizeForecast(item) {
  return {
    time: new Date(item.dt * 1000).toISOString(),
    temperature: item.main.temp,
    condition: item.weather[0]?.description ?? '정보 없음',
    humidity: item.main.humidity,
    windSpeed: item.wind.speed,
    precipitationProbability: Math.round((item.pop ?? 0) * 100),
  }
}

function nearestForecast(forecast, targetTime) {
  const target = new Date(targetTime).getTime()
  return forecast.reduce((nearest, item) => {
    const gap = Math.abs(new Date(item.time).getTime() - target)
    return !nearest || gap < nearest.gap ? { ...item, gap } : nearest
  }, null)
}

async function requestJson(path, city, apiKey) {
  const url = new URL(path, 'https://api.openweathermap.org')
  url.search = new URLSearchParams({
    lat: String(city.latitude),
    lon: String(city.longitude),
    appid: apiKey,
    units: 'metric',
    lang: 'kr',
  })
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) {
    throw new Error(`${city.name} OpenWeather 요청 실패 (${response.status})`)
  }
  return response.json()
}

async function requestCity(city, apiKey) {
  const [currentData, forecastData] = await Promise.all([
    requestJson('/data/2.5/weather', city, apiKey),
    requestJson('/data/2.5/forecast', city, apiKey),
  ])
  const forecast = forecastData.list.map(normalizeForecast)
  const currentTime = new Date(currentData.dt * 1000).toISOString()
  return {
    cityId: city.id,
    cityName: city.name,
    source: 'OpenWeather',
    current: normalizeCurrent(currentData, nearestForecast(forecast, currentTime)),
    forecast,
  }
}

const apiKey = process.env.OPENWEATHER_API_KEY?.trim()
if (!apiKey) throw new Error('OPENWEATHER_API_KEY 값이 비어 있습니다.')

const cityEntries = []
for (const city of cities) {
  const bundle = await requestCity(city, apiKey)
  cityEntries.push([city.id, bundle])
}

const outputPath = resolve('public/data/openweather.json')
const snapshot = {
  source: 'OpenWeather',
  generatedAt: new Date().toISOString(),
  cities: Object.fromEntries(cityEntries),
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(snapshot)}\n`, 'utf8')
console.log(`OpenWeather snapshot ready: ${cityEntries.length} cities`)
