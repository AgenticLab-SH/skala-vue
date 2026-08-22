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

export function explainScore(weather, scoreResult) {
  const reasons = []
  if (weather.precipitationProbability <= 20) reasons.push('비 걱정이 적습니다')
  else if (weather.precipitationProbability >= 60) reasons.push('비를 만날 가능성이 큽니다')

  if (scoreResult.scores.temperature >= 90) reasons.push('활동하기 편한 기온입니다')
  else reasons.push('기온에 맞는 준비가 필요합니다')

  if (scoreResult.scores.wind < 70) reasons.push('바람이 활동에 방해될 수 있습니다')
  else if (weather.windSpeed <= 5) reasons.push('바람이 강하지 않습니다')

  return reasons.slice(0, 3)
}
