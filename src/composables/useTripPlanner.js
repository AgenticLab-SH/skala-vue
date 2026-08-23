import { computed, ref } from 'vue'

import { getActivityPlace, supportsActivity } from '../data/activityPlaces'
import { weatherCities } from '../data/weatherCities'
import { estimateTravel, requestDrivingRoute } from '../services/routeApi'
import { findNearestForecast, requestWeatherBundle } from '../services/weatherApi'
import { calculateActivityScore } from '../utils/weatherScore'

function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000)
}

function localActivityDestination(origin, city, activityPlace, activityId) {
  if (origin.id !== city.id || !activityPlace?.latitude || !activityPlace?.longitude) return city
  return {
    ...city,
    id: `${city.id}-${activityId}`,
    name: activityPlace.name,
    latitude: activityPlace.latitude,
    longitude: activityPlace.longitude,
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function buildRecommendation(
  city,
  routeDestination,
  route,
  bundle,
  departureAt,
  activityId,
  maxTravelMinutes,
) {
  const arrivalAt = addMinutes(departureAt, route.minutes)
  const weather = findNearestForecast(bundle, arrivalAt) ?? bundle.current
  const scoreResult = calculateActivityScore(weather, activityId)
  const activityPlace = getActivityPlace(city, activityId)
  const combinedScore = Math.round(scoreResult.total * 0.82 + activityPlace.fit * 0.18)
  const travelPenalty = Math.max(0, Math.round((route.minutes / maxTravelMinutes - 0.75) * 12))

  return {
    city,
    routeDestination,
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
  const selectedCityId = ref('')
  let latestInput = null

  const bestRecommendation = computed(() => recommendations.value[0] ?? null)
  const selectedRecommendation = computed(
    () =>
      recommendations.value.find((item) => item.city.id === selectedCityId.value) ??
      bestRecommendation.value,
  )

  function updateTimeAlternatives(recommendation) {
    if (!recommendation || !latestInput) {
      timeAlternatives.value = []
      return
    }
    timeAlternatives.value = [-180, -120, -60, 60, 120, 180].map((delay) => {
      const changedDeparture = addMinutes(latestInput.departureAt, delay)
      const changed = buildRecommendation(
        recommendation.city,
        recommendation.routeDestination,
        recommendation.route,
        recommendation.bundle,
        changedDeparture,
        latestInput.activityId,
        latestInput.maxTravelMinutes,
      )
      return {
        delay,
        departureAt: changedDeparture,
        arrivalAt: changed.arrivalAt,
        weather: changed.weather,
        score: changed.score,
      }
    })
  }

  function selectRecommendation(cityId) {
    const recommendation = recommendations.value.find((item) => item.city.id === cityId)
    if (!recommendation) return
    selectedCityId.value = cityId
    updateTimeAlternatives(recommendation)
  }

  async function runPlanner({ originId, activityId, departureAt, maxTravelMinutes }) {
    const runId = ++activeRunId
    const loadingStartedAt = Date.now()
    const origin = weatherCities.find((city) => city.id === originId)
    if (!origin) return

    status.value = 'loading'
    errorMessage.value = ''
    recommendations.value = []
    timeAlternatives.value = []
    failedCityCount.value = 0
    selectedCityId.value = ''
    latestInput = { activityId, departureAt, maxTravelMinutes }

    const candidates = weatherCities
      .filter((city) => supportsActivity(city, activityId))
      .map((city) => {
        const activityPlace = getActivityPlace(city, activityId)
        const routeDestination = localActivityDestination(origin, city, activityPlace, activityId)
        return {
          city,
          routeDestination,
          route: estimateTravel(origin, routeDestination),
        }
      })
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

    const routes = await Promise.all(
      available.map(({ routeDestination }) => requestDrivingRoute(origin, routeDestination)),
    )
    if (runId !== activeRunId) return

    recommendations.value = available
      .map((item, index) =>
        buildRecommendation(
          item.city,
          item.routeDestination,
          routes[index],
          item.bundle,
          departureAt,
          activityId,
          maxTravelMinutes,
        ),
      )
      .filter((item) => item.route.minutes <= maxTravelMinutes)
      .sort((a, b) => b.score - a.score)

    const best = recommendations.value[0]
    if (!best) {
      status.value = 'empty'
      errorMessage.value =
        '예상 시간으로는 가까워 보였지만 실제 경로를 확인하니 범위 안에 남는 도시가 없었습니다.'
      return
    }

    selectRecommendation(best.city.id)

    // 요청이 빠른 경우에도 진행 상태를 알아볼 수 있도록 짧게 유지합니다.
    const remainingLoadingTime = 1100 - (Date.now() - loadingStartedAt)
    if (remainingLoadingTime > 0) await wait(remainingLoadingTime)
    if (runId !== activeRunId) return

    status.value = 'success'
  }

  return {
    status,
    errorMessage,
    recommendations,
    timeAlternatives,
    failedCityCount,
    bestRecommendation,
    selectedRecommendation,
    selectRecommendation,
    runPlanner,
  }
}
