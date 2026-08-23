import axios from 'axios'

const routeApi = axios.create({ baseURL: 'https://router.project-osrm.org', timeout: 9000 })

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function calculateStraightDistance(from, to) {
  const earthRadius = 6371
  const latitudeGap = toRadians(to.latitude - from.latitude)
  const longitudeGap = toRadians(to.longitude - from.longitude)
  const startLatitude = toRadians(from.latitude)
  const endLatitude = toRadians(to.latitude)
  const value =
    Math.sin(latitudeGap / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeGap / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function estimateTravel(from, to) {
  const straightDistance = calculateStraightDistance(from, to)
  const geometry = [
    [from.longitude, from.latitude],
    [to.longitude, to.latitude],
  ]
  if (from.transportMode === 'air' || to.transportMode === 'air') {
    return {
      distance: Math.round(straightDistance),
      minutes: Math.round(150 + (straightDistance / 500) * 60),
      source: '공항 이동 포함 항공 추정',
      geometry,
    }
  }
  const distance = Math.round(straightDistance * 1.24)
  const minutes = Math.round((distance / 72) * 60 + 20)
  return { distance, minutes, source: '직선거리 기반 추정', geometry }
}

function withSingleRoute(route) {
  return { ...route, alternatives: [{ ...route }] }
}

export async function requestDrivingRoute(from, to) {
  if (from.id === to.id) {
    const localEstimate = estimateTravel(from, to)
    return withSingleRoute({
      ...localEstimate,
      source: '도시 내부 이동 추정',
    })
  }
  if (from.transportMode === 'air' || to.transportMode === 'air') {
    return withSingleRoute(estimateTravel(from, to))
  }
  try {
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`
    const response = await routeApi.get(`/route/v1/driving/${coordinates}`, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        alternatives: 3,
        steps: 'false',
      },
    })
    const fallback = estimateTravel(from, to)
    const alternatives = (response.data.routes ?? []).map((route, index) => ({
      distance: Math.round(route.distance / 1000),
      minutes: Math.round(route.duration / 60),
      source: index === 0 ? 'OSRM 경로' : `OSRM 대안 ${index + 1}`,
      geometry: route.geometry?.coordinates ?? fallback.geometry,
    }))
    const route = alternatives[0]
    if (!route) return withSingleRoute(fallback)
    return {
      ...route,
      alternatives,
    }
  } catch {
    return withSingleRoute(estimateTravel(from, to))
  }
}
