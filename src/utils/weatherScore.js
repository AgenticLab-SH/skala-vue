import { findActivity } from '../data/activities'

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function temperatureScore(temperature, ideal) {
  if (temperature >= ideal.minTemp && temperature <= ideal.maxTemp) return 100
  const distance =
    temperature < ideal.minTemp ? ideal.minTemp - temperature : temperature - ideal.maxTemp
  return clamp(100 - distance * 11)
}

function limitScore(value, limit, penalty) {
  if (value <= limit) return 100
  return clamp(100 - (value - limit) * penalty)
}

export function calculateActivityScore(weather, activityId) {
  const activity = findActivity(activityId)
  const scores = {
    rain: limitScore(weather.precipitationProbability, activity.ideal.maxRain, 1.7),
    temperature: temperatureScore(weather.temperature, activity.ideal),
    wind: limitScore(weather.windSpeed, activity.ideal.maxWind, 7),
    humidity: limitScore(weather.humidity, activity.ideal.maxHumidity, 2),
  }

  const total = Math.round(
    scores.rain * 0.45 + scores.temperature * 0.25 + scores.wind * 0.2 + scores.humidity * 0.1,
  )

  return { total, scores, activity }
}

export function getScoreLabel(score) {
  if (score >= 85) return '아주 좋음'
  if (score >= 70) return '괜찮음'
  if (score >= 55) return '조금 아쉬움'
  return '계획 변경 권장'
}
