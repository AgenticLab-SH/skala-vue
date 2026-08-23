const EARTH_RADIUS_METERS = 6371008.8

function toRadians(value) {
  return (value * Math.PI) / 180
}

function toDegrees(value) {
  return (value * 180) / Math.PI
}

function closeRing(ring) {
  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring.at(-1)
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
}

function outerRings(geometry) {
  if (geometry?.type === 'Polygon')
    return geometry.coordinates?.[0] ? [geometry.coordinates[0]] : []
  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates?.flatMap((polygon) => (polygon[0] ? [polygon[0]] : [])) ?? []
  }
  return []
}

function buildingHeight(properties = {}) {
  const height = Number(
    properties.render_height ?? properties.height ?? Number(properties.levels) * 3,
  )
  const base = Number(properties.render_min_height ?? properties.min_height ?? 0)
  if (!Number.isFinite(height) || height <= base) return 0
  return height - base
}

function ringCenter(ring) {
  const points = ring.slice(0, -1)
  if (!points.length) return [0, 0]
  const [longitude, latitude] = points.reduce(
    ([longitudeSum, latitudeSum], point) => [longitudeSum + point[0], latitudeSum + point[1]],
    [0, 0],
  )
  return [longitude / points.length, latitude / points.length]
}

export function destinationCoordinate([longitude, latitude], distanceMeters, bearingDegrees) {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS
  const bearing = toRadians(bearingDegrees)
  const startLatitude = toRadians(latitude)
  const startLongitude = toRadians(longitude)
  const endLatitude = Math.asin(
    Math.sin(startLatitude) * Math.cos(angularDistance) +
      Math.cos(startLatitude) * Math.sin(angularDistance) * Math.cos(bearing),
  )
  const endLongitude =
    startLongitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(startLatitude),
      Math.cos(angularDistance) - Math.sin(startLatitude) * Math.sin(endLatitude),
    )
  return [toDegrees(endLongitude), toDegrees(endLatitude)]
}

export function createBuildingShadows(buildings, sunPosition, maximumBuildings = 450) {
  const altitude = Number(sunPosition?.altitude)
  const azimuth = Number(sunPosition?.azimuth)
  if (!Number.isFinite(altitude) || !Number.isFinite(azimuth) || altitude <= 0) {
    return { type: 'FeatureCollection', features: [] }
  }

  const shadowBearing = (azimuth + 180) % 360
  const seen = new Set()
  const features = []

  for (const building of buildings) {
    if (features.length >= maximumBuildings) break
    const height = buildingHeight(building.properties)
    if (!height) continue

    for (const rawRing of outerRings(building.geometry)) {
      const ring = closeRing(rawRing)
      if (ring.length < 4) continue
      const center = ringCenter(ring)
      const key = `${building.id ?? building.properties?.osm_id ?? ''}:${center[0].toFixed(5)}:${center[1].toFixed(5)}:${Math.round(height)}`
      if (seen.has(key)) continue
      seen.add(key)

      // 해가 지평선 가까이에 있을 때 그림자가 지나치게 길어지지 않도록 지도 표현 범위를 제한합니다.
      const shadowLength = Math.min(240, height / Math.tan(toRadians(Math.max(altitude, 3))))
      const shifted = ring.map((point) => destinationCoordinate(point, shadowLength, shadowBearing))
      const polygons = [[closeRing(shifted)]]
      for (let index = 0; index < ring.length - 1; index += 1) {
        polygons.push([
          closeRing([ring[index], ring[index + 1], shifted[index + 1], shifted[index]]),
        ])
      }
      features.push({
        type: 'Feature',
        properties: { height: Math.round(height), shadowLength: Math.round(shadowLength) },
        geometry: { type: 'MultiPolygon', coordinates: polygons },
      })
      if (features.length >= maximumBuildings) break
    }
  }

  return { type: 'FeatureCollection', features }
}

function ringBounds(ring) {
  return ring.reduce(
    (bounds, point) => ({
      west: Math.min(bounds.west, point[0]),
      east: Math.max(bounds.east, point[0]),
      south: Math.min(bounds.south, point[1]),
      north: Math.max(bounds.north, point[1]),
    }),
    { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity },
  )
}

function pointInRing(point, ring) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [longitude, latitude] = ring[index]
    const [previousLongitude, previousLatitude] = ring[previous]
    const intersects =
      latitude > point[1] !== previousLatitude > point[1] &&
      point[0] <
        ((previousLongitude - longitude) * (point[1] - latitude)) / (previousLatitude - latitude) +
          longitude
    if (intersects) inside = !inside
  }
  return inside
}

function shadowRings(shadowCollection) {
  return shadowCollection.features.flatMap((feature) => {
    if (feature.geometry?.type === 'Polygon') return [feature.geometry.coordinates[0]]
    if (feature.geometry?.type === 'MultiPolygon') {
      return feature.geometry.coordinates.map((polygon) => polygon[0])
    }
    return []
  })
}

function isInBounds(point, bounds) {
  return (
    !bounds ||
    (point[0] >= bounds.west &&
      point[0] <= bounds.east &&
      point[1] >= bounds.south &&
      point[1] <= bounds.north)
  )
}

function sampleRoute(coordinates, bounds, maximumSamples = 220) {
  const visible = coordinates.filter((point) => isInBounds(point, bounds))
  if (visible.length <= maximumSamples) return visible
  const step = Math.ceil(visible.length / maximumSamples)
  return visible.filter((_, index) => index % step === 0)
}

export function compareRouteShade(routes, shadowCollection, bounds) {
  const rings = shadowRings(shadowCollection).map((ring) => ({ ring, bounds: ringBounds(ring) }))
  const fastestMinutes = Math.min(...routes.map((route) => route.minutes))

  return routes.map((route, index) => {
    const samples = sampleRoute(route.geometry ?? [], bounds)
    const shadedSamples = samples.filter((point) =>
      rings.some((shadow) => isInBounds(point, shadow.bounds) && pointInRing(point, shadow.ring)),
    ).length
    const shadeRatio = samples.length ? shadedSamples / samples.length : 0
    const extraMinutes = Math.max(0, route.minutes - fastestMinutes)
    // 10분 우회는 표시 구간의 그늘이 15%p 이상 늘 때만 선택되도록 균형을 맞췄습니다.
    const score = shadeRatio * 100 - extraMinutes * 1.5
    return {
      index,
      score,
      shadeRatio,
      shadedSamples,
      sampleCount: samples.length,
      extraMinutes,
    }
  })
}

export function chooseShadedRoute(routes, shadowCollection, bounds) {
  const comparisons = compareRouteShade(routes, shadowCollection, bounds)
  const visibleComparisons = comparisons.filter((comparison) => comparison.sampleCount > 0)
  const best = visibleComparisons.reduce(
    (best, current) => (!best || current.score > best.score ? current : best),
    null,
  )
  return best ? { ...best, comparisons } : null
}
