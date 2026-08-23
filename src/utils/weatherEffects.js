const RAIN_PATTERN = /비|이슬비|소나기|뇌우|우박|rain|drizzle|shower|thunder/i
const SNOW_PATTERN = /눈|진눈깨비|snow|sleet/i
const FOG_PATTERN = /안개|박무|연무|fog|mist|haze/i
const CLOUD_PATTERN = /흐림|구름|cloud|overcast/i
const CLEAR_PATTERN = /맑음|대체로 맑음|clear|sunny/i

function findIntensity(condition) {
  if (/강한|폭우|우박|뇌우|heavy|thunder/i.test(condition)) return 'heavy'
  if (/약한|이슬비|drizzle|light/i.test(condition)) return 'light'
  return 'medium'
}

export function createWeatherEffect(weather = {}, cityName = '') {
  const condition = String(weather.condition ?? '').trim()
  let mode = 'none'

  if (SNOW_PATTERN.test(condition)) mode = 'snow'
  else if (RAIN_PATTERN.test(condition)) mode = 'rain'
  else if (FOG_PATTERN.test(condition)) mode = 'fog'
  else if (CLOUD_PATTERN.test(condition)) mode = 'cloud'
  else if (CLEAR_PATTERN.test(condition)) mode = 'sun'

  return {
    mode,
    intensity: mode === 'rain' || mode === 'snow' ? findIntensity(condition) : 'medium',
    cityName,
    condition,
    precipitationProbability: Number.isFinite(weather.precipitationProbability)
      ? weather.precipitationProbability
      : null,
  }
}

export function emptyWeatherEffect() {
  return createWeatherEffect()
}
