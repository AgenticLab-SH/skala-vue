import { computed, ref } from 'vue'

import { getActivityPlace, supportsActivity } from '../data/activityPlaces'
import { weatherCities } from '../data/weatherCities'
import { estimateTravel, requestDrivingRoute } from '../services/routeApi'
import { findNearestForecast, requestWeatherBundle } from '../services/weatherApi'
import { calculateActivityScore } from '../utils/weatherScore'

function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000)
}

function buildRecommendation(city, route, bundle, departureAt, activityId, maxTravelMinutes) {
  const arrivalAt = addMinutes(departureAt, route.minutes)
  const weather = findNearestForecast(bundle, arrivalAt) ?? bundle.current
  const scoreResult = calculateActivityScore(weather, activityId)
  const activityPlace = getActivityPlace(city, activityId)
  const combinedScore = Math.round(scoreResult.total * 0.82 + activityPlace.fit * 0.18)
  const travelPenalty = Math.max(0, Math.round((route.minutes / maxTravelMinutes - 0.75) * 12))

  return {
    city,
    route,
    bundle,
    weather,
    activityPlace,
    arrivalAt,
    score: Math.max(0, combinedScore - travelPenalty),
    weatherScore: scoreResult.total,
    placeScore: activityPlace.fit,
    scoreDetails: scoreResult.scores,
  }
}

export function useTripPlanner() {
  let activeRunId = 0
  const status = ref('idle')
  const errorMessage = ref('')
  const recommendations = ref([])
  const timeAlternatives = ref([])
  const failedCityCount = ref(0)

  const bestRecommendation = computed(() => recommendations.value[0] ?? null)

  async function runPlanner({ originId, activityId, departureAt, maxTravelMinutes }) {
    const runId = ++activeRunId
    const origin = weatherCities.find((city) => city.id === originId)
    if (!origin) return

    status.value = 'loading'
    errorMessage.value = ''
    recommendations.value = []
    timeAlternatives.value = []
    failedCityCount.value = 0

    const candidates = weatherCities
      .filter((city) => city.id !== origin.id && supportsActivity(city, activityId))
      .map((city) => ({ city, route: estimateTravel(origin, city) }))
      .filter(({ route }) => route.minutes <= maxTravelMinutes * 1.15)

    if (!candidates.length) {
      status.value = 'empty'
      errorMessage.value = '이 활동을 할 장소가 이동 시간 안에 없습니다.'
      return
    }

    const weatherResults = await Promise.allSettled(
      candidates.map(({ city }) => requestWeatherBundle(city)),
    )
    if (runId !== activeRunId) return

    const available = candidates.flatMap((candidate, index) => {
      const result = weatherResults[index]
      if (result.status === 'rejected') return []
      return [{ ...candidate, bundle: result.value }]
    })
    failedCityCount.value = candidates.length - available.length

    if (!available.length) {
      status.value = 'error'
      errorMessage.value =
        '날씨 서버에서 응답을 받지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.'
      return
    }

    const routes = await Promise.all(available.map(({ city }) => requestDrivingRoute(origin, city)))
    if (runId !== activeRunId) return

    recommendations.value = available
      .map((item, index) =>
        buildRecommendation(
          item.city,
          routes[index],
          item.bundle,
          departureAt,
          activityId,
          maxTravelMinutes,
        ),
      )
      .filter((item) => item.route.minutes <= maxTravelMinutes)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)

    const best = recommendations.value[0]
    if (!best) {
      status.value = 'empty'
      errorMessage.value =
        '예상 시간으로는 가까워 보였지만 실제 경로를 확인하니 범위 안에 남는 도시가 없었습니다.'
      return
    }

    timeAlternatives.value = [0, 180, 360].map((delay) => {
      const changedDeparture = addMinutes(departureAt, delay)
      const changed = buildRecommendation(
        best.city,
        best.route,
        best.bundle,
        changedDeparture,
        activityId,
        maxTravelMinutes,
      )
      return {
        delay,
        departureAt: changedDeparture,
        arrivalAt: changed.arrivalAt,
        weather: changed.weather,
        score: changed.score,
      }
    })

    status.value = 'success'
  }

  return {
    status,
    errorMessage,
    recommendations,
    timeAlternatives,
    failedCityCount,
    bestRecommendation,
    runPlanner,
  }
}
