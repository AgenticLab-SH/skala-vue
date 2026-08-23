<script setup>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getPosition } from 'suncalc'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useConfigStore } from '../../stores/configStore'
import { chooseShadedRoute, createBuildingShadows } from '../../utils/shadeRoute'

const props = defineProps({
  origin: { type: Object, required: true },
  destination: { type: Object, required: true },
  route: { type: Object, required: true },
  arrivalAt: { type: [Date, String], required: true },
  weatherGrid: { type: Array, default: () => [] },
  weatherGridStatus: { type: String, default: 'loading' },
  weatherGridError: { type: String, default: '' },
})

const emit = defineEmits(['mode-change', 'retry-weather-grid'])
const configStore = useConfigStore()
const mapContainer = ref(null)
const mapStatus = ref('loading')
const mapError = ref('')
const mapMode = ref('route')
const isThreeDimensional = ref(false)
const isVerificationOpen = ref(false)
const routeStrategy = ref('fastest')
const activeRouteIndex = ref(0)
const shadeStatus = ref('idle')
const shadeMessage = ref('도착 시각의 태양각과 건물 높이로 경로 대안을 비교합니다.')
const shadeMetrics = ref(null)
const mapViewport = ref({
  longitude: props.destination.longitude,
  latitude: props.destination.latitude,
  zoom: 7,
})
let map
let loadTimer
let shadeTimer
let shadeCalculationToken = 0
let weatherPopup
let weatherMotionMarkers = []

const routeAlternatives = computed(() => {
  const alternatives = props.route.alternatives?.length ? props.route.alternatives : [props.route]
  return alternatives.filter((route) => route.geometry?.length >= 2)
})

const activeRoute = computed(
  () =>
    routeAlternatives.value[activeRouteIndex.value] ?? routeAlternatives.value[0] ?? props.route,
)

const coordinates = computed(() => {
  if (activeRoute.value.geometry?.length >= 2) return activeRoute.value.geometry
  return [
    [props.origin.longitude, props.origin.latitude],
    [props.destination.longitude, props.destination.latitude],
  ]
})

const routeGeoJson = computed(() => ({
  type: 'Feature',
  properties: { source: activeRoute.value.source },
  geometry: { type: 'LineString', coordinates: coordinates.value },
}))

const routeAlternativesGeoJson = computed(() => ({
  type: 'FeatureCollection',
  features: routeAlternatives.value
    .map((route, index) => ({ route, index }))
    .filter(({ index }) => index !== activeRouteIndex.value)
    .map(({ route, index }) => ({
      type: 'Feature',
      properties: { index, minutes: route.minutes },
      geometry: { type: 'LineString', coordinates: route.geometry },
    })),
}))

const pointGeoJson = computed(() => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'origin', label: `출발 · ${props.origin.name}` },
      geometry: { type: 'Point', coordinates: [props.origin.longitude, props.origin.latitude] },
    },
    {
      type: 'Feature',
      properties: { kind: 'destination', label: `도착 · ${props.destination.name}` },
      geometry: {
        type: 'Point',
        coordinates: [props.destination.longitude, props.destination.latitude],
      },
    },
  ],
}))

const weatherGeoJson = computed(() => {
  const regionConditions = new Map()
  props.weatherGrid.forEach((point) => {
    const current = regionConditions.get(point.regionId) ?? {
      isRaining: false,
      isCloudy: false,
    }
    current.isRaining ||= point.isRaining
    current.isCloudy ||= point.isCloudy
    regionConditions.set(point.regionId, current)
  })

  return {
    type: 'FeatureCollection',
    features: props.weatherGrid.map((point) => ({
      type: 'Feature',
      properties: {
        id: point.id,
        regionId: point.regionId,
        name: point.name,
        mapLabel: point.mapLabel,
        regionName: point.regionName,
        subregion: point.subregion,
        detailLevel: point.detailLevel,
        condition: point.condition,
        kind: point.kind,
        temperature: point.temperature,
        precipitation: point.precipitation,
        rainAmount: point.rainAmount,
        cloudCover: point.cloudCover,
        isRaining: point.isRaining,
        isCloudy: point.isCloudy,
        regionHasRain: regionConditions.get(point.regionId)?.isRaining ?? false,
        regionHasCloud: regionConditions.get(point.regionId)?.isCloudy ?? false,
      },
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
    })),
  }
})

const rainRegions = computed(() => props.weatherGrid.filter((point) => point.isRaining))
const cloudyRegions = computed(() => props.weatherGrid.filter((point) => point.isCloudy))
const regionCount = computed(() => new Set(props.weatherGrid.map((point) => point.regionId)).size)
const rainRegionCount = computed(
  () => new Set(rainRegions.value.map((point) => point.regionId)).size,
)
const cloudyRegionCount = computed(
  () => new Set(cloudyRegions.value.map((point) => point.regionId)).size,
)
const visibleWeatherRegions = computed(() => {
  if (mapMode.value === 'rain') return rainRegions.value
  if (mapMode.value === 'cloud') return cloudyRegions.value
  if (mapMode.value === 'weather') return props.weatherGrid
  return []
})
const visibleWeatherGroups = computed(() => {
  const groups = new Map()
  visibleWeatherRegions.value.forEach((point) => {
    const current = groups.get(point.regionId) ?? {
      id: point.regionId,
      name: point.regionName,
      points: [],
    }
    current.points.push(point)
    groups.set(point.regionId, current)
  })
  return [...groups.values()].map((group) => ({
    ...group,
    rainyCount: group.points.filter((point) => point.isRaining).length,
    cloudyCount: group.points.filter((point) => point.isCloudy).length,
    minTemperature: Math.round(Math.min(...group.points.map((point) => point.temperature))),
    maxTemperature: Math.round(Math.max(...group.points.map((point) => point.temperature))),
    maxRainAmount: Math.max(...group.points.map((point) => point.rainAmount)),
  }))
})

const routeSummary = computed(
  () =>
    `${props.origin.name}에서 ${props.destination.name}까지 ${activeRoute.value.distance}km, 약 ${activeRoute.value.minutes}분입니다. 경로 출처는 ${activeRoute.value.source}입니다.`,
)

const mapTitle = computed(() => {
  if (mapMode.value === 'rain') return '지금 비 오는 세부 지점'
  if (mapMode.value === 'cloud') return '지금 흐린 세부 지점'
  if (mapMode.value === 'weather') return '한국 세부 지점 현재 날씨'
  return `${props.origin.name}에서 ${props.destination.name}까지`
})

const mapSummary = computed(() => {
  if (mapMode.value === 'rain')
    return `현재 비가 확인된 세부 지점 ${rainRegions.value.length}곳, 기준 지역 ${rainRegionCount.value}곳입니다.`
  if (mapMode.value === 'cloud')
    return `현재 운량이 높은 세부 지점 ${cloudyRegions.value.length}곳, 기준 지역 ${cloudyRegionCount.value}곳입니다.`
  if (mapMode.value === 'weather')
    return `한국 ${regionCount.value}개 기준 지역, ${props.weatherGrid.length}개 세부 지점의 현재 날씨입니다.`
  return routeSummary.value
})

const mapAriaLabel = computed(() =>
  mapMode.value === 'route' ? `경로 지도. ${routeSummary.value}` : `기상 지도. ${mapSummary.value}`,
)

const weatherUpdatedAt = computed(() => {
  const time = props.weatherGrid[0]?.time
  if (!time) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(time))
})

const arrivalTimeLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(props.arrivalAt)),
)

const emptyWeatherMessage = computed(() =>
  mapMode.value === 'rain'
    ? '현재 확인된 지점에는 비가 없습니다.'
    : '현재 확인된 지점에는 흐린 곳이 없습니다.',
)

const nearestVerificationRegion = computed(() => {
  const regionalPoints = props.weatherGrid.filter((point) => point.detailLevel === 'region')
  return regionalPoints.reduce((nearest, point) => {
    const distance =
      (point.latitude - mapViewport.value.latitude) ** 2 +
      (point.longitude - mapViewport.value.longitude) ** 2
    return !nearest || distance < nearest.distance ? { ...point, distance } : nearest
  }, null)
})

const nearbyRainPoints = computed(() =>
  [...rainRegions.value]
    .sort(
      (a, b) =>
        (a.latitude - mapViewport.value.latitude) ** 2 +
        (a.longitude - mapViewport.value.longitude) ** 2 -
        ((b.latitude - mapViewport.value.latitude) ** 2 +
          (b.longitude - mapViewport.value.longitude) ** 2),
    )
    .slice(0, 4),
)

const naverWeatherUrl = computed(() => {
  const regionName = nearestVerificationRegion.value?.regionName ?? props.destination.name
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${regionName} 날씨`)}`
})

const kmaWeatherMapUrl = computed(
  () =>
    `https://www.weather.go.kr/wgis-nuri/html/map.html?location=${mapViewport.value.longitude.toFixed(5)},${mapViewport.value.latitude.toFixed(5)}&zoom=${Math.max(5, Math.min(12, mapViewport.value.zoom)).toFixed(1)}&fold=true&blank=true`,
)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setLayerVisibility(layerId, visible) {
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function weatherFilter(layerId = '') {
  const modeFilter =
    mapMode.value === 'rain'
      ? ['==', ['get', 'isRaining'], true]
      : mapMode.value === 'cloud'
        ? ['==', ['get', 'isCloudy'], true]
        : mapMode.value === 'route'
          ? ['any', ['==', ['get', 'isRaining'], true], ['==', ['get', 'isCloudy'], true]]
          : ['has', 'id']
  if (layerId === 'weather-labels') {
    const regionModeFilter =
      mapMode.value === 'rain'
        ? ['==', ['get', 'regionHasRain'], true]
        : mapMode.value === 'cloud'
          ? ['==', ['get', 'regionHasCloud'], true]
          : mapMode.value === 'route'
            ? [
                'any',
                ['==', ['get', 'regionHasRain'], true],
                ['==', ['get', 'regionHasCloud'], true],
              ]
            : ['has', 'id']
    return ['all', regionModeFilter, ['==', ['get', 'detailLevel'], 'region']]
  }
  if (layerId === 'weather-detail-labels') {
    return ['all', modeFilter, ['==', ['get', 'detailLevel'], 'local']]
  }
  return modeFilter
}

function applyMapMode() {
  if (!map || mapStatus.value !== 'ready') return
  const routeVisible = mapMode.value === 'route'
  const weatherVisible = !routeVisible
  const weatherPointsVisible = props.weatherGridStatus === 'success'

  ;['route-shadow', 'route-line', 'route-points-halo', 'route-points'].forEach((layerId) =>
    setLayerVisibility(layerId, routeVisible),
  )
  setLayerVisibility(
    'route-alternatives',
    routeVisible && routeStrategy.value === 'shade' && routeAlternatives.value.length > 1,
  )
  setLayerVisibility('building-shadows', routeVisible && isThreeDimensional.value)
  setLayerVisibility('destination-buildings', routeVisible)
  setLayerVisibility(
    'weather-cloud-area',
    weatherVisible && (mapMode.value === 'weather' || mapMode.value === 'cloud'),
  )
  setLayerVisibility(
    'weather-rain-area',
    weatherVisible && (mapMode.value === 'weather' || mapMode.value === 'rain'),
  )
  ;['weather-points-halo', 'weather-points', 'weather-labels', 'weather-detail-labels'].forEach(
    (layerId) => {
      setLayerVisibility(layerId, weatherPointsVisible)
      if (map.getLayer(layerId)) map.setFilter(layerId, weatherFilter(layerId))
    },
  )
  syncWeatherMotionMarkers()
}

function addRouteLayers() {
  map.addSource('route-alternatives', { type: 'geojson', data: routeAlternativesGeoJson.value })
  map.addLayer({
    id: 'route-alternatives',
    type: 'line',
    source: 'route-alternatives',
    layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#687786',
      'line-width': 3,
      'line-opacity': 0.56,
      'line-dasharray': [1.2, 1.4],
    },
  })
  map.addSource('route', { type: 'geojson', data: routeGeoJson.value })
  map.addLayer({
    id: 'route-shadow',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.88 },
  })
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#2f7de1', 'line-width': 5 },
  })
  map.addSource('route-points', { type: 'geojson', data: pointGeoJson.value })
  map.addLayer({
    id: 'route-points-halo',
    type: 'circle',
    source: 'route-points',
    paint: { 'circle-radius': 9, 'circle-color': '#ffffff' },
  })
  map.addLayer({
    id: 'route-points',
    type: 'circle',
    source: 'route-points',
    paint: {
      'circle-radius': 6,
      'circle-color': ['match', ['get', 'kind'], 'origin', '#17202a', '#2f7de1'],
    },
  })
}

function addWeatherLayers() {
  map.addSource('weather-grid', { type: 'geojson', data: weatherGeoJson.value })
  map.addLayer({
    id: 'weather-cloud-area',
    type: 'circle',
    source: 'weather-grid',
    filter: ['==', ['get', 'isCloudy'], true],
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        ['match', ['get', 'detailLevel'], 'region', 8, 4],
        9,
        ['match', ['get', 'detailLevel'], 'region', 18, 12],
      ],
      'circle-color': '#7c8996',
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 0.24, 0],
        7.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 0.24, 0.2],
      ],
      'circle-blur': 0.58,
    },
  })
  map.addLayer({
    id: 'weather-rain-area',
    type: 'circle',
    source: 'weather-grid',
    filter: ['==', ['get', 'isRaining'], true],
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'rainAmount'],
        0,
        ['match', ['get', 'detailLevel'], 'region', 6, 3],
        0.5,
        ['match', ['get', 'detailLevel'], 'region', 10, 6],
        5,
        ['match', ['get', 'detailLevel'], 'region', 16, 10],
      ],
      'circle-color': '#2f75b9',
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 0.44, 0],
        7.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 0.44, 0.38],
      ],
      'circle-blur': 0.32,
    },
  })
  map.addLayer({
    id: 'weather-points-halo',
    type: 'circle',
    source: 'weather-grid',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['match', ['get', 'detailLevel'], 'region', 7, 5],
      'circle-color': 'rgba(255,255,255,0.9)',
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 1, 0],
        7.8,
        1,
      ],
    },
  })
  map.addLayer({
    id: 'weather-points',
    type: 'circle',
    source: 'weather-grid',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['match', ['get', 'detailLevel'], 'region', 5, 3.5],
      'circle-color': [
        'match',
        ['get', 'kind'],
        'rain',
        '#1f6fb8',
        'cloud',
        '#65727f',
        'fog',
        '#7f8a93',
        'snow',
        '#8aa9bf',
        '#c5902f',
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6.8,
        ['case', ['==', ['get', 'detailLevel'], 'region'], 1, 0],
        7.8,
        1,
      ],
    },
  })
  map.addLayer({
    id: 'weather-labels',
    type: 'symbol',
    source: 'weather-grid',
    minzoom: 5.4,
    layout: {
      visibility: 'none',
      'text-field': ['get', 'mapLabel'],
      'text-size': 11,
      'text-anchor': 'top',
      'text-offset': [0, 1.05],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#273441',
      'text-halo-color': 'rgba(255,255,255,0.94)',
      'text-halo-width': 1.6,
    },
  })
  map.addLayer({
    id: 'weather-detail-labels',
    type: 'symbol',
    source: 'weather-grid',
    minzoom: 8.4,
    filter: ['==', ['get', 'detailLevel'], 'local'],
    layout: {
      visibility: 'none',
      'text-field': ['get', 'mapLabel'],
      'text-size': 10,
      'text-anchor': 'top',
      'text-offset': [0, 0.9],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#3d4a57',
      'text-halo-color': 'rgba(255,255,255,0.94)',
      'text-halo-width': 1.4,
    },
  })
}

function createWeatherMotionElement(point) {
  const element = document.createElement('div')
  element.className = 'weather-motion-cell'
  element.dataset.detailLevel = point.detailLevel
  element.dataset.pointId = point.id
  element.setAttribute('aria-hidden', 'true')

  const cloudLayer = document.createElement('span')
  cloudLayer.className = 'weather-motion-clouds'
  for (let index = 0; index < 2; index += 1) {
    const cloud = document.createElement('i')
    cloud.style.setProperty('--cloud-top', `${9 + index * 7}px`)
    cloud.style.setProperty('--cloud-left', `${3 + index * 15}px`)
    cloud.style.setProperty('--cloud-delay', `${index * -1.7}s`)
    cloudLayer.append(cloud)
  }

  const rainLayer = document.createElement('span')
  rainLayer.className = 'weather-motion-rain'
  for (let index = 0; index < 8; index += 1) {
    const drop = document.createElement('i')
    drop.style.setProperty('--rain-x', `${(index * 29 + point.id.length * 7) % 100}%`)
    drop.style.setProperty('--rain-delay', `${-((index * 17) % 24) / 10}s`)
    drop.style.setProperty('--rain-duration', `${0.68 + (index % 4) * 0.09}s`)
    drop.style.setProperty('--rain-length', `${7 + (index % 3) * 3}px`)
    rainLayer.append(drop)
  }

  element.append(cloudLayer, rainLayer)
  return element
}

function clearWeatherMotionMarkers() {
  weatherMotionMarkers.forEach(({ marker }) => marker.remove())
  weatherMotionMarkers = []
}

function rebuildWeatherMotionMarkers() {
  clearWeatherMotionMarkers()
  if (!map || mapStatus.value !== 'ready') return

  const regionalPoints = props.weatherGrid
    .filter((point) => point.detailLevel === 'region')
    .map((point) => {
      const regionPoints = props.weatherGrid.filter((item) => item.regionId === point.regionId)
      return {
        ...point,
        overviewIsRaining: regionPoints.some((item) => item.isRaining),
        overviewIsCloudy: regionPoints.some((item) => item.isCloudy),
      }
    })
  const localPoints = props.weatherGrid.filter(
    (point) => point.detailLevel === 'local' && (point.isRaining || point.isCloudy),
  )

  weatherMotionMarkers = [...regionalPoints, ...localPoints]
    .filter(
      (point) =>
        point.isRaining || point.isCloudy || point.overviewIsRaining || point.overviewIsCloudy,
    )
    .map((point) => {
      const element = createWeatherMotionElement(point)
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map)
      // 장식용 marker는 지도 조작 대상이 아니므로 빈 키보드 버튼으로 노출하지 않습니다.
      element.removeAttribute('role')
      element.removeAttribute('tabindex')
      return { marker, element, point }
    })
  syncWeatherMotionMarkers()
}

function syncWeatherMotionMarkers() {
  const enabled = configStore.mapWeatherMotionEnabled
  const zoom = map?.getZoom() ?? 0
  const showLocalDetails = zoom >= 7.4
  weatherMotionMarkers.forEach(({ element, point }) => {
    const isOverviewRegion = point.detailLevel === 'region' && !showLocalDetails
    const isRaining = isOverviewRegion ? point.overviewIsRaining : point.isRaining
    const isCloudy = isOverviewRegion ? point.overviewIsCloudy : point.isCloudy
    const visible =
      enabled &&
      !isThreeDimensional.value &&
      (point.detailLevel === 'region' || showLocalDetails) &&
      (mapMode.value === 'route' ||
        mapMode.value === 'weather' ||
        (mapMode.value === 'rain' && isRaining) ||
        (mapMode.value === 'cloud' && isCloudy)) &&
      (isRaining || isCloudy)
    const effectKind =
      mapMode.value === 'rain' ||
      ((mapMode.value === 'route' || mapMode.value === 'weather') && isRaining)
        ? 'rain'
        : 'cloud'
    element.classList.toggle('is-visible', visible)
    element.classList.toggle('is-overview', zoom < 6.7)
    element.classList.toggle('weather-motion-cell--rain', visible && effectKind === 'rain')
    element.classList.toggle('weather-motion-cell--cloud', visible && effectKind === 'cloud')
  })
}

function updateMapViewport() {
  if (!map) return
  const center = map.getCenter()
  mapViewport.value = {
    longitude: center.lng,
    latitude: center.lat,
    zoom: map.getZoom(),
  }
  syncWeatherMotionMarkers()
}

function addBuildingLayer() {
  const labelLayer = map
    .getStyle()
    .layers?.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id
  map.addSource('openfreemap-buildings', {
    type: 'vector',
    url: 'https://tiles.openfreemap.org/planet',
  })
  map.addLayer(
    {
      id: 'destination-buildings',
      type: 'fill-extrusion',
      source: 'openfreemap-buildings',
      'source-layer': 'building',
      minzoom: 14,
      filter: ['!=', ['get', 'hide_3d'], true],
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'render_height'], 8],
          0,
          '#d7dee5',
          80,
          '#aebbc8',
          200,
          '#8697a8',
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          15,
          ['coalesce', ['get', 'render_height'], 8],
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.82,
        'fill-extrusion-vertical-gradient': true,
      },
    },
    labelLayer,
  )

  map.addSource('building-shadows', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })
  map.addLayer(
    {
      id: 'building-shadows',
      type: 'fill',
      source: 'building-shadows',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#273a4a',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'shadowLength'],
          0,
          0.3,
          80,
          0.42,
          240,
          0.5,
        ],
        'fill-outline-color': 'rgba(31, 49, 65, 0.38)',
      },
    },
    'destination-buildings',
  )
}

function visibleMapBounds() {
  const bounds = map.getBounds()
  return {
    west: bounds.getWest(),
    east: bounds.getEast(),
    south: bounds.getSouth(),
    north: bounds.getNorth(),
  }
}

function updateRouteSources() {
  if (!map || mapStatus.value !== 'ready') return
  map.getSource('route')?.setData(routeGeoJson.value)
  map.getSource('route-alternatives')?.setData(routeAlternativesGeoJson.value)
  map.getSource('route-points')?.setData(pointGeoJson.value)
}

function clearBuildingShadows() {
  map?.getSource('building-shadows')?.setData({ type: 'FeatureCollection', features: [] })
}

function useFastestRoute() {
  shadeCalculationToken += 1
  window.clearTimeout(shadeTimer)
  routeStrategy.value = 'fastest'
  activeRouteIndex.value = 0
  shadeStatus.value = 'idle'
  shadeMetrics.value = null
  shadeMessage.value = '가장 짧은 OSRM 경로를 표시합니다.'
  clearBuildingShadows()
  updateRouteSources()
  showWholeRoute()
  syncWeatherMotionMarkers()
}

function calculateBuildingShadows(token, shouldChooseRoute, loadAttempt = 0) {
  if (
    token !== shadeCalculationToken ||
    !map ||
    mapStatus.value !== 'ready' ||
    mapMode.value !== 'route' ||
    !isThreeDimensional.value
  ) {
    return
  }

  if (!map.isSourceLoaded('openfreemap-buildings') && loadAttempt < 2) {
    shadeMessage.value = '도착지 건물 높이 데이터를 기다리고 있습니다.'
    shadeTimer = window.setTimeout(
      () => calculateBuildingShadows(token, shouldChooseRoute, loadAttempt + 1),
      1200,
    )
    return
  }

  const sun = getPosition(
    new Date(props.arrivalAt),
    props.destination.latitude,
    props.destination.longitude,
  )
  if (!Number.isFinite(sun.altitude) || sun.altitude <= 0) {
    if (shouldChooseRoute) activeRouteIndex.value = 0
    shadeStatus.value = 'unavailable'
    shadeMessage.value = '도착 시각에는 해가 져 있어 빠른 경로만 표시합니다.'
    shadeMetrics.value = null
    clearBuildingShadows()
    updateRouteSources()
    applyMapMode()
    return
  }

  const buildings = map.querySourceFeatures('openfreemap-buildings', {
    sourceLayer: 'building',
  })
  const shadows = createBuildingShadows(buildings, sun)
  map.getSource('building-shadows')?.setData(shadows)

  if (!shadows.features.length) {
    if (shouldChooseRoute) activeRouteIndex.value = 0
    shadeStatus.value = 'unavailable'
    shadeMessage.value = '현재 지도에서 높이가 있는 건물을 찾지 못했습니다.'
    shadeMetrics.value = null
    updateRouteSources()
    applyMapMode()
    return
  }

  const selected = chooseShadedRoute(routeAlternatives.value, shadows, visibleMapBounds())
  if (shouldChooseRoute && !selected) {
    activeRouteIndex.value = 0
    shadeStatus.value = 'unavailable'
    shadeMessage.value = '표시 중인 도착지 구간과 경로가 겹치지 않아 빠른 경로를 유지합니다.'
    shadeMetrics.value = null
    updateRouteSources()
    applyMapMode()
    return
  }

  if (shouldChooseRoute) activeRouteIndex.value = selected.index
  const displayedRouteShade = shouldChooseRoute
    ? selected
    : selected?.comparisons.find((comparison) => comparison.index === activeRouteIndex.value)
  shadeStatus.value = 'ready'
  shadeMetrics.value = {
    altitude: Math.round(sun.altitude),
    azimuth: Math.round(sun.azimuth),
    buildingCount: shadows.features.length,
    shadePercent: Math.round((displayedRouteShade?.shadeRatio ?? 0) * 100),
    extraMinutes: displayedRouteShade?.extraMinutes ?? 0,
    sampleCount: displayedRouteShade?.sampleCount ?? 0,
  }
  if (shouldChooseRoute) {
    shadeMessage.value =
      routeAlternatives.value.length > 1
        ? `경로 ${routeAlternatives.value.length}개를 비교해 그늘과 이동 시간의 균형이 나은 경로를 표시합니다.`
        : '건물 그림자는 표시했지만 경로 대안이 없어 현재 경로를 유지합니다.'
  } else {
    shadeMessage.value = '도착 시각의 건물 그림자를 3D 지도에 표시합니다.'
  }
  updateRouteSources()
  applyMapMode()
}

function queueBuildingShadowCalculation(shouldChooseRoute) {
  const token = ++shadeCalculationToken
  let calculated = false
  const runCalculation = () => {
    if (calculated) return
    calculated = true
    window.clearTimeout(shadeTimer)
    calculateBuildingShadows(token, shouldChooseRoute)
  }
  map.once('idle', runCalculation)
  shadeTimer = window.setTimeout(runCalculation, 1700)
}

function useShadedRoute() {
  if (!map || mapStatus.value !== 'ready') return
  routeStrategy.value = 'shade'
  activeRouteIndex.value = 0
  shadeStatus.value = 'loading'
  shadeMetrics.value = null
  shadeMessage.value = '도착지 건물과 태양각을 불러오고 있습니다.'
  mapMode.value = 'route'
  isThreeDimensional.value = true
  updateRouteSources()
  applyMapMode()
  syncWeatherMotionMarkers()
  map.easeTo({
    center: [props.destination.longitude, props.destination.latitude],
    zoom: 16.4,
    pitch: 50,
    bearing: -18,
    duration: prefersReducedMotion() ? 0 : 650,
  })
  queueBuildingShadowCalculation(true)
}

function showWholeRoute() {
  if (!map || mapStatus.value !== 'ready') return
  mapMode.value = 'route'
  isThreeDimensional.value = false
  weatherPopup?.remove()
  applyMapMode()
  const bounds = coordinates.value.reduce(
    (currentBounds, coordinate) => currentBounds.extend(coordinate),
    new maplibregl.LngLatBounds(coordinates.value[0], coordinates.value[0]),
  )
  map.fitBounds(bounds, {
    padding: { top: 72, right: 52, bottom: 72, left: 52 },
    maxZoom: 12,
    pitch: 0,
    bearing: 0,
    duration: prefersReducedMotion() ? 0 : 600,
  })
  emit('mode-change', 'route')
}

function fitWeatherRegions(regions) {
  if (!map || !props.weatherGrid.length) return
  const targets = regions.length ? regions : props.weatherGrid
  const first = targets[0]
  const bounds = targets.reduce(
    (currentBounds, point) => currentBounds.extend([point.longitude, point.latitude]),
    new maplibregl.LngLatBounds(
      [first.longitude, first.latitude],
      [first.longitude, first.latitude],
    ),
  )
  map.fitBounds(bounds, {
    padding: { top: 72, right: 72, bottom: 80, left: 72 },
    maxZoom: regions.length === 1 ? 9 : 7.4,
    pitch: 0,
    bearing: 0,
    duration: prefersReducedMotion() ? 0 : 600,
  })
}

function showWeatherMode(mode) {
  if (!map || mapStatus.value !== 'ready' || props.weatherGridStatus !== 'success') return
  shadeCalculationToken += 1
  window.clearTimeout(shadeTimer)
  routeStrategy.value = 'fastest'
  activeRouteIndex.value = 0
  shadeStatus.value = 'idle'
  shadeMetrics.value = null
  shadeMessage.value = '도착 시각의 태양각과 건물 높이로 경로 대안을 비교합니다.'
  clearBuildingShadows()
  updateRouteSources()
  mapMode.value = mode
  isThreeDimensional.value = false
  weatherPopup?.remove()
  applyMapMode()
  fitWeatherRegions(visibleWeatherRegions.value)
  emit('mode-change', mode)
}

function showDestinationIn3d() {
  if (!map || mapStatus.value !== 'ready') return
  mapMode.value = 'route'
  isThreeDimensional.value = true
  shadeStatus.value = 'loading'
  shadeMetrics.value = null
  shadeMessage.value = '도착 시각의 건물 그림자를 계산하고 있습니다.'
  applyMapMode()
  syncWeatherMotionMarkers()
  map.easeTo({
    center: [props.destination.longitude, props.destination.latitude],
    zoom: 16.2,
    pitch: 52,
    bearing: -18,
    duration: prefersReducedMotion() ? 0 : 650,
  })
  queueBuildingShadowCalculation(false)
}

function toggleView() {
  if (isThreeDimensional.value) showWholeRoute()
  else showDestinationIn3d()
}

function createWeatherPopupContent(point) {
  const container = document.createElement('div')
  container.className = 'weather-map-popup'
  const title = document.createElement('strong')
  title.textContent = `${point.name} · ${point.condition}`
  const details = document.createElement('span')
  details.textContent = `${Math.round(point.temperature)}℃ · 강수 ${point.rainAmount}mm · 운량 ${point.cloudCover}%`
  const spots = document.createElement('span')
  spots.className = 'weather-map-popup-spots'
  spots.textContent = `가볼 곳 · ${(point.spots ?? [])
    .slice(0, 2)
    .map((spot) => spot.name)
    .join(', ')}`
  container.append(title, details, spots)
  return container
}

function focusWeatherRegion(point) {
  if (!map || mapStatus.value !== 'ready') return
  map.easeTo({
    center: [point.longitude, point.latitude],
    zoom: Math.max(map.getZoom(), 8.2),
    pitch: 0,
    bearing: 0,
    duration: prefersReducedMotion() ? 0 : 450,
  })
  weatherPopup?.remove()
  weatherPopup = new maplibregl.Popup({ offset: 14, closeButton: false })
    .setLngLat([point.longitude, point.latitude])
    .setDOMContent(createWeatherPopupContent(point))
    .addTo(map)
}

function focusWeatherGroup(group) {
  if (!map || mapStatus.value !== 'ready' || !group.points.length) return
  const first = group.points[0]
  const bounds = group.points.reduce(
    (currentBounds, point) => currentBounds.extend([point.longitude, point.latitude]),
    new maplibregl.LngLatBounds(
      [first.longitude, first.latitude],
      [first.longitude, first.latitude],
    ),
  )
  map.fitBounds(bounds, {
    padding: { top: 92, right: 92, bottom: 92, left: 92 },
    maxZoom: 9.4,
    pitch: 0,
    bearing: 0,
    duration: prefersReducedMotion() ? 0 : 450,
  })
}

function naverPointUrl(point) {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${point.name} 날씨`)}`
}

function weatherGroupStatus(group) {
  if (mapMode.value === 'rain') return `비 ${group.points.length}개 세부 지점`
  if (mapMode.value === 'cloud') return `흐림 ${group.points.length}개 세부 지점`
  return `비 ${group.rainyCount}/${group.points.length} · 흐림 ${group.cloudyCount}/${group.points.length}`
}

function temperatureRange(group) {
  return group.minTemperature === group.maxTemperature
    ? `${group.minTemperature}℃`
    : `${group.minTemperature}~${group.maxTemperature}℃`
}

function updateMapData() {
  if (!map || mapStatus.value !== 'ready') return
  shadeCalculationToken += 1
  window.clearTimeout(shadeTimer)
  routeStrategy.value = 'fastest'
  activeRouteIndex.value = 0
  shadeStatus.value = 'idle'
  shadeMetrics.value = null
  shadeMessage.value = '도착 시각의 태양각과 건물 높이로 경로 대안을 비교합니다.'
  clearBuildingShadows()
  updateRouteSources()
  if (mapMode.value === 'route') showWholeRoute()
  syncWeatherMotionMarkers()
}

function updateWeatherData() {
  if (!map || mapStatus.value !== 'ready') return
  map.getSource('weather-grid')?.setData(weatherGeoJson.value)
  applyMapMode()
  if (mapMode.value !== 'route' && props.weatherGrid.length) {
    fitWeatherRegions(visibleWeatherRegions.value)
  }
}

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value) return
  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [props.destination.longitude, props.destination.latitude],
      zoom: 7,
      cooperativeGestures: true,
      attributionControl: true,
      canvasContextAttributes: { antialias: true },
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    loadTimer = window.setTimeout(() => {
      if (mapStatus.value === 'loading') {
        mapStatus.value = 'error'
        mapError.value = '지도를 불러오는 데 시간이 오래 걸리고 있습니다.'
      }
    }, 12000)
    map.on('load', () => {
      try {
        addRouteLayers()
        addWeatherLayers()
        addBuildingLayer()
        window.clearTimeout(loadTimer)
        mapStatus.value = 'ready'
        rebuildWeatherMotionMarkers()
        showWholeRoute()
        updateMapViewport()
      } catch {
        window.clearTimeout(loadTimer)
        mapStatus.value = 'error'
        mapError.value = '지도 데이터 일부를 불러오지 못했습니다.'
      }
    })
    map.on('click', 'weather-points', (event) => {
      const id = event.features?.[0]?.properties?.id
      const point = props.weatherGrid.find((item) => item.id === id)
      if (point) focusWeatherRegion(point)
    })
    map.on('mouseenter', 'weather-points', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'weather-points', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('zoomend', updateMapViewport)
    map.on('moveend', updateMapViewport)
  } catch {
    mapStatus.value = 'error'
    mapError.value = '이 브라우저에서는 3D 지도를 표시할 수 없습니다.'
  }
})

watch([() => props.route, () => props.destination.id], updateMapData)
watch(activeRouteIndex, updateRouteSources)
watch(weatherGeoJson, () => {
  updateWeatherData()
  rebuildWeatherMotionMarkers()
})
watch(() => configStore.mapWeatherMotionEnabled, syncWeatherMotionMarkers)
watch(routeStrategy, syncWeatherMotionMarkers)

onBeforeUnmount(() => {
  window.clearTimeout(loadTimer)
  window.clearTimeout(shadeTimer)
  weatherPopup?.remove()
  clearWeatherMotionMarkers()
  map?.remove()
})
</script>

<template>
  <section class="route-map-section" aria-labelledby="route-map-title">
    <header class="route-map-heading">
      <div>
        <p>{{ mapMode === 'route' ? '이동 경로' : '현재 기상 지도' }}</p>
        <h3 id="route-map-title">{{ mapTitle }}</h3>
        <span>{{ mapSummary }}</span>
      </div>
      <button
        v-if="mapStatus === 'ready' && mapMode === 'route' && routeStrategy === 'fastest'"
        class="map-view-toggle"
        type="button"
        :aria-pressed="isThreeDimensional"
        @click="toggleView"
      >
        {{ isThreeDimensional ? '전체 경로 보기' : '목적지 3D 보기' }}
      </button>
    </header>

    <div class="map-mode-controls" role="group" aria-label="지도 종류">
      <button
        type="button"
        :aria-pressed="mapMode === 'route'"
        :disabled="mapStatus !== 'ready'"
        @click="useFastestRoute"
      >
        이동 경로
      </button>
      <button
        type="button"
        :aria-pressed="mapMode !== 'route'"
        :disabled="weatherGridStatus !== 'success' || mapStatus !== 'ready'"
        @click="showWeatherMode('weather')"
      >
        전국 날씨 <span>{{ regionCount }}</span>
      </button>
    </div>

    <div
      v-if="mapMode !== 'route'"
      class="weather-filter-controls"
      role="group"
      aria-label="날씨 조건"
    >
      <button
        type="button"
        :aria-pressed="mapMode === 'weather'"
        @click="showWeatherMode('weather')"
      >
        전체
      </button>
      <button type="button" :aria-pressed="mapMode === 'rain'" @click="showWeatherMode('rain')">
        비 <span>{{ rainRegionCount }}</span>
      </button>
      <button type="button" :aria-pressed="mapMode === 'cloud'" @click="showWeatherMode('cloud')">
        흐림 <span>{{ cloudyRegionCount }}</span>
      </button>
    </div>

    <section
      v-if="mapMode === 'route'"
      class="route-strategy-panel"
      :class="{ 'has-result': routeStrategy === 'shade' }"
      aria-label="경로 계산 방식"
    >
      <div class="route-strategy-controls" role="group" aria-label="경로 선택">
        <button
          type="button"
          :aria-pressed="routeStrategy === 'fastest'"
          :disabled="mapStatus !== 'ready'"
          @click="useFastestRoute"
        >
          <strong>빠른 경로</strong>
          <span>최단 시간</span>
        </button>
        <button
          type="button"
          :aria-pressed="routeStrategy === 'shade'"
          :disabled="mapStatus !== 'ready'"
          @click="useShadedRoute"
        >
          <strong>그늘 경로</strong>
          <span>건물 그림자 비교</span>
        </button>
      </div>
      <div
        v-if="routeStrategy === 'shade'"
        class="shade-result"
        :class="`is-${shadeStatus}`"
        aria-live="polite"
      >
        <p>{{ shadeMessage }}</p>
        <dl v-if="shadeMetrics">
          <div>
            <dt>태양 고도</dt>
            <dd>{{ shadeMetrics.altitude }}°</dd>
          </div>
          <div>
            <dt>건물</dt>
            <dd>{{ shadeMetrics.buildingCount }}개</dd>
          </div>
          <div>
            <dt>표시 구간 그늘</dt>
            <dd>{{ shadeMetrics.shadePercent }}%</dd>
          </div>
          <div>
            <dt>추가 시간</dt>
            <dd>{{ shadeMetrics.extraMinutes ? `${shadeMetrics.extraMinutes}분` : '없음' }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <div v-if="weatherGridStatus === 'loading'" class="weather-layer-status" role="status">
      전국 기상 지점을 불러오고 있습니다.
    </div>
    <div v-else-if="weatherGridStatus === 'error'" class="weather-layer-status" role="status">
      <span>{{ weatherGridError }}</span>
      <button type="button" @click="emit('retry-weather-grid')">다시 불러오기</button>
    </div>

    <div class="map-frame">
      <div ref="mapContainer" class="map-canvas" role="region" :aria-label="mapAriaLabel"></div>
      <div
        v-if="mapMode === 'route' && isThreeDimensional"
        class="map-shadow-legend"
        :class="`is-${shadeStatus}`"
        role="status"
      >
        <span><i aria-hidden="true"></i>건물 그림자</span>
        <small v-if="shadeStatus === 'ready'">{{ arrivalTimeLabel }} 도착 기준</small>
        <small v-else-if="shadeStatus === 'loading'">계산 중</small>
        <small v-else>{{ shadeMessage }}</small>
      </div>
      <button
        v-if="mapStatus === 'ready' && !(mapMode === 'route' && isThreeDimensional)"
        class="map-motion-toggle"
        type="button"
        :aria-pressed="configStore.mapWeatherMotionEnabled"
        :aria-label="`지도 날씨 모션 ${configStore.mapWeatherMotionEnabled ? '끄기' : '켜기'}`"
        @click="configStore.toggleMapWeatherMotion"
      >
        <span class="motion-switch" aria-hidden="true"><i></i></span>
        날씨 모션 {{ configStore.mapWeatherMotionEnabled ? '켬' : '끔' }}
      </button>
      <div v-if="mapStatus === 'loading'" class="map-state" role="status">
        지도를 불러오고 있습니다.
      </div>
      <div v-else-if="mapStatus === 'error'" class="map-state" role="status">
        <strong>경로 요약은 확인할 수 있습니다.</strong>
        <span>{{ mapError }}</span>
      </div>
      <div
        v-else-if="['rain', 'cloud'].includes(mapMode) && !visibleWeatherRegions.length"
        class="map-empty-state"
      >
        <strong>{{ emptyWeatherMessage }}</strong>
        <button type="button" @click="showWeatherMode('weather')">전체 날씨 보기</button>
      </div>
      <div
        v-if="
          weatherGridStatus === 'success' && !(mapMode === 'route' && routeStrategy === 'shade')
        "
        class="weather-legend"
        aria-label="기상 지도 범례"
      >
        <span><i class="legend-rain"></i>비</span>
        <span><i class="legend-cloud"></i>흐림</span>
        <span><i class="legend-clear"></i>맑음</span>
      </div>
      <p class="map-caption">
        <template v-if="mapMode === 'route'">
          <span v-if="routeStrategy === 'shade'">
            도착지 주변 지도에 로드된 건물과 경로 대안을 비교한 결과이며 보행 안전을 보장하지
            않습니다.
          </span>
          <span v-else-if="isThreeDimensional">
            도착 시각의 태양각과 지도 건물 높이로 계산한 그림자를 3D 건물과 함께 표시합니다.
          </span>
          <span v-else>
            3D 건물과 이동선을 함께 확인합니다. 날씨 모션은 현재 기상 지점을 기준으로 표시합니다.
          </span>
        </template>
        <template v-else>
          Open-Meteo 현재 모델값을 {{ weatherGrid.length }}개 세부 지점에 표시하며 기상 레이더
          경계는 아닙니다.
          {{ weatherUpdatedAt ? `${weatherUpdatedAt} 기준` : '' }}
        </template>
      </p>
    </div>

    <details
      v-if="weatherGridStatus === 'success'"
      class="weather-verification"
      @toggle="isVerificationOpen = $event.currentTarget.open"
    >
      <summary>
        <span class="verification-title">
          <strong>외부 날씨와 비교하기</strong>
          <small>기상청 지도와 네이버 날씨로 현재 결과 확인</small>
        </span>
        <span class="verification-disclosure">
          {{ isVerificationOpen ? '비교 자료 닫기' : '비교 자료 열기' }}
          <i aria-hidden="true">⌄</i>
        </span>
      </summary>
      <div class="verification-content">
        <div class="verification-map-heading">
          <div>
            <span>기상청 비교 지도</span>
            <strong>현재 지도 중심과 배율을 맞췄습니다.</strong>
          </div>
          <small>공식 날씨 지도에서 레이더 등 필요한 레이어를 선택할 수 있습니다.</small>
        </div>
        <iframe
          v-if="isVerificationOpen"
          class="verification-map-frame"
          :src="kmaWeatherMapUrl"
          title="기상청 날씨 지도 비교 화면"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <div class="verification-heading">
          <div>
            <span>현재 지도 중심</span>
            <strong>{{ nearestVerificationRegion?.regionName ?? destination.name }} 인근</strong>
          </div>
          <p>
            우리 지도는 {{ weatherGrid.length }}개 모델 지점을
            {{ weatherUpdatedAt || '현재' }} 기준으로 비교합니다.
          </p>
        </div>
        <div class="verification-actions">
          <a :href="naverWeatherUrl" target="_blank" rel="noopener noreferrer">
            네이버에서 지역 날씨 확인 <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.weather.go.kr/w/weather/radar/radar.do"
            target="_blank"
            rel="noopener noreferrer"
          >
            기상청 레이더 전체 화면 <span aria-hidden="true">↗</span>
          </a>
          <a
            class="verification-text-link"
            href="https://weather.naver.com/map/18330670"
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 전국 날씨 지도 열기 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="nearby-rain-check">
          <strong>현재 중심에서 가까운 비 지점</strong>
          <ul v-if="nearbyRainPoints.length">
            <li v-for="point in nearbyRainPoints" :key="`verify-${point.id}`">
              <span>
                <b>{{ point.name }}</b>
                {{ point.condition }} · {{ point.rainAmount }}mm
              </span>
              <a :href="naverPointUrl(point)" target="_blank" rel="noopener noreferrer">
                네이버 확인 <span aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>
          <p v-else>현재 확인된 비 지점이 없습니다.</p>
        </div>
        <p class="verification-note">
          네이버 날씨는 외부 페이지 안에 표시할 수 없어 새 창으로 엽니다. 같은 화면에서는 기상청
          날씨 지도를 현재 중심과 배율에 맞춰 비교합니다. 제공자마다 관측 방식과 갱신 시각이 달라
          결과가 다를 수 있습니다.
        </p>
      </div>
    </details>

    <section v-if="mapMode !== 'route'" class="weather-region-panel" aria-live="polite">
      <header>
        <strong>{{ mapTitle }}</strong>
        <span
          >{{ visibleWeatherGroups.length }}개 지역 · {{ visibleWeatherRegions.length }}개 세부
          지점</span
        >
      </header>
      <div v-if="visibleWeatherGroups.length" class="weather-region-list">
        <button
          v-for="group in visibleWeatherGroups"
          :key="group.id"
          type="button"
          @click="focusWeatherGroup(group)"
        >
          <span>
            <strong>{{ group.name }}</strong>
            <small>{{ weatherGroupStatus(group) }}</small>
            <small class="weather-spots">
              {{ group.points.map((point) => point.subregion).join(' · ') }}
            </small>
          </span>
          <span class="weather-values">
            {{ temperatureRange(group) }} · 최대 강수 {{ group.maxRainAmount }}mm
          </span>
        </button>
      </div>
      <div v-else class="weather-region-empty">
        {{ emptyWeatherMessage }}
        <button type="button" @click="showWeatherMode('weather')">전체 날씨 보기</button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.route-map-section {
  margin-top: 24px;
}

.route-map-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.route-map-heading p,
.route-map-heading h3,
.route-map-heading span {
  margin: 0;
}

.route-map-heading p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.route-map-heading h3 {
  margin-top: 7px;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.route-map-heading span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 14px;
}

.map-view-toggle,
.map-mode-controls button,
.weather-filter-controls button {
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: var(--glass);
  color: var(--ink);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.map-view-toggle {
  flex: 0 0 auto;
  padding: 0 18px;
  border-radius: 999px;
  box-shadow:
    0 8px 24px rgba(22, 34, 46, 0.12),
    inset 0 1px rgba(255, 255, 255, 0.9);
  font-weight: 750;
}

.map-mode-controls {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  margin-bottom: 12px;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.map-mode-controls::-webkit-scrollbar {
  display: none;
}

.map-mode-controls button {
  flex: 0 0 auto;
  padding: 0 15px;
  border-color: var(--line);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.map-mode-controls button[aria-pressed='true'] {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}

.map-mode-controls button:disabled {
  cursor: wait;
  opacity: 0.48;
}

.map-mode-controls span {
  margin-left: 5px;
  font-variant-numeric: tabular-nums;
}

.weather-filter-controls {
  display: flex;
  gap: 6px;
  margin: -4px 0 12px;
}

.weather-filter-controls button {
  min-width: 76px;
  padding: 0 14px;
  border-color: var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.weather-filter-controls button[aria-pressed='true'] {
  border-color: var(--ink);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

.weather-filter-controls span {
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
}

.route-strategy-panel {
  margin-bottom: 12px;
}

.route-strategy-panel.has-result {
  display: grid;
  grid-template-columns: minmax(300px, 0.7fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 10px;
}

.route-strategy-controls {
  display: grid;
  max-width: 480px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.route-strategy-panel.has-result .route-strategy-controls {
  max-width: none;
}

.route-strategy-controls button {
  display: grid;
  min-height: 62px;
  align-content: center;
  gap: 3px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--surface);
  color: var(--ink);
  text-align: left;
}

.route-strategy-controls button[aria-pressed='true'] {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}

.route-strategy-controls button span {
  color: var(--muted);
  font-size: 11px;
}

.route-strategy-controls button[aria-pressed='true'] span {
  color: rgba(255, 255, 255, 0.72);
}

.route-strategy-controls button:disabled {
  cursor: wait;
  opacity: 0.56;
}

.shade-result {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 13px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--soft);
}

.shade-result p {
  max-width: 420px;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.shade-result.is-loading p::before {
  content: '계산 중 · ';
  color: var(--accent);
  font-weight: 800;
}

.shade-result dl {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(2, auto);
  gap: 3px 16px;
  margin: 0;
}

.shade-result dl div {
  display: flex;
  gap: 5px;
  font-size: 11px;
}

.shade-result dt {
  color: var(--muted);
}

.shade-result dd {
  margin: 0;
  font-weight: 800;
}

.weather-layer-status {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  padding: 9px 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
}

.weather-layer-status button {
  min-height: 36px;
  padding: 0 8px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}

.map-frame {
  position: relative;
  overflow: hidden;
  min-height: 500px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--soft);
}

.map-canvas {
  position: absolute;
  inset: 0;
}

.map-shadow-legend {
  position: absolute;
  z-index: 4;
  top: 12px;
  left: 12px;
  display: grid;
  min-height: 44px;
  align-content: center;
  gap: 2px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 13px;
  background: rgba(247, 250, 253, 0.88);
  box-shadow: 0 10px 28px rgba(20, 34, 49, 0.15);
  color: #273441;
  pointer-events: none;
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.map-shadow-legend span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 800;
}

.map-shadow-legend i {
  width: 18px;
  height: 9px;
  border: 1px solid rgba(31, 49, 65, 0.38);
  border-radius: 2px;
  background: rgba(39, 58, 74, 0.5);
}

.map-shadow-legend small {
  max-width: 240px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.35;
}

.map-shadow-legend.is-loading i {
  opacity: 0.45;
}

.map-motion-toggle {
  position: absolute;
  z-index: 4;
  top: 12px;
  right: 12px;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 9px;
  padding: 0 13px 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 14px;
  background: rgba(247, 250, 253, 0.86);
  box-shadow:
    0 10px 28px rgba(20, 34, 49, 0.16),
    inset 0 1px rgba(255, 255, 255, 0.94);
  color: #273441;
  font-size: 12px;
  font-weight: 800;
  backdrop-filter: blur(20px) saturate(155%);
  -webkit-backdrop-filter: blur(20px) saturate(155%);
}

.motion-switch {
  position: relative;
  width: 30px;
  height: 18px;
  border-radius: 999px;
  background: #9aa5af;
  box-shadow: inset 0 1px 3px rgba(20, 34, 49, 0.22);
  transition: background 180ms ease-out;
}

.motion-switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 5px rgba(20, 34, 49, 0.22);
  transition: transform 180ms ease-out;
}

.map-motion-toggle[aria-pressed='true'] .motion-switch {
  background: #2773bf;
}

.map-motion-toggle[aria-pressed='true'] .motion-switch i {
  transform: translateX(12px);
}

.map-state,
.map-empty-state {
  position: absolute;
  z-index: 3;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 10px;
  padding: 30px;
  background: rgba(242, 245, 248, 0.9);
  color: var(--muted);
  text-align: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.map-state strong,
.map-empty-state strong {
  color: var(--ink);
}

.map-empty-state button {
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}

.weather-legend {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 12px;
  background: var(--glass);
  color: #3c4854;
  font-size: 12px;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

.weather-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.weather-legend i {
  width: 9px;
  height: 9px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
}

.legend-rain {
  background: #1f6fb8;
}

.legend-cloud {
  background: #65727f;
}

.legend-clear {
  background: #c5902f;
}

.map-caption {
  position: absolute;
  z-index: 2;
  right: 14px;
  bottom: 14px;
  max-width: min(470px, calc(100% - 28px));
  padding: 9px 13px;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 12px;
  background: var(--glass);
  box-shadow: 0 8px 24px rgba(22, 34, 46, 0.1);
  color: #3c4854;
  font-size: 12px;
  line-height: 1.5;
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

.weather-verification {
  margin-top: 10px;
  border-block: 1px solid var(--line);
  background: var(--surface);
}

.weather-verification summary {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 4px;
  cursor: pointer;
  list-style: none;
}

.weather-verification summary::-webkit-details-marker {
  display: none;
}

.weather-verification .verification-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.verification-disclosure {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
}

.weather-verification summary small,
.verification-heading span,
.verification-heading p,
.verification-note,
.nearby-rain-check p {
  color: var(--muted);
  font-size: 12px;
}

.verification-disclosure i {
  color: var(--muted);
  font-size: 18px;
  font-style: normal;
  transition: transform 180ms ease-out;
}

.weather-verification[open] .verification-disclosure i {
  transform: rotate(180deg);
}

.weather-verification[open] summary,
.weather-verification summary:hover {
  background: var(--soft);
}

.weather-verification summary:focus-visible {
  outline: 3px solid rgba(37, 99, 168, 0.25);
  outline-offset: 3px;
}

.verification-content {
  padding: 18px 4px 22px;
  border-top: 1px solid var(--line);
}

.verification-map-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 10px;
}

.verification-map-heading > div {
  display: grid;
  gap: 3px;
}

.verification-map-heading span,
.verification-map-heading small {
  color: var(--muted);
  font-size: 12px;
}

.verification-map-frame {
  display: block;
  width: 100%;
  height: 420px;
  margin-bottom: 22px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--soft);
}

.verification-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.verification-heading > div {
  display: grid;
  gap: 4px;
}

.verification-heading strong {
  font-size: 18px;
}

.verification-heading p {
  max-width: 470px;
  margin: 0;
  line-height: 1.6;
  text-align: right;
}

.verification-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.verification-actions a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.verification-actions .verification-text-link {
  border-color: transparent;
  color: var(--muted);
  font-weight: 650;
}

.nearby-rain-check {
  margin-top: 18px;
}

.nearby-rain-check > strong {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
}

.nearby-rain-check ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.nearby-rain-check li {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}

.nearby-rain-check li:nth-child(odd) {
  padding-right: 16px;
  border-right: 1px solid var(--line);
}

.nearby-rain-check li:nth-child(even) {
  padding-left: 16px;
}

.nearby-rain-check li b {
  margin-right: 7px;
  color: var(--ink);
}

.nearby-rain-check a {
  flex: 0 0 auto;
  color: var(--accent);
  font-weight: 700;
  text-decoration: none;
}

.verification-note {
  margin: 14px 0 0;
  line-height: 1.6;
}

.weather-region-panel {
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}

.weather-region-panel > header {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 16px;
  border-bottom: 1px solid var(--line);
}

.weather-region-panel > header span {
  color: var(--muted);
  font-size: 13px;
}

.weather-region-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.weather-region-list button {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 16px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  text-align: left;
}

.weather-region-list button:nth-child(odd) {
  border-right: 1px solid var(--line);
}

.weather-region-list button span:first-child {
  display: flex;
  min-width: 80px;
  flex-direction: column;
  gap: 3px;
}

.weather-region-list .weather-spots {
  overflow: hidden;
  max-width: 260px;
  color: #3f5366;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-region-list small,
.weather-values {
  color: var(--muted);
  font-size: 12px;
}

.weather-values {
  text-align: right;
}

.weather-region-empty {
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 16px;
  color: var(--muted);
}

.weather-region-empty button {
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}

:global(.weather-map-popup) {
  display: grid;
  min-width: 190px;
  gap: 4px;
  color: #17202a;
  font-family: Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif;
}

:global(.weather-map-popup span) {
  color: #626c77;
  font-size: 12px;
}

:global(.weather-map-popup .weather-map-popup-spots) {
  padding-top: 5px;
  margin-top: 2px;
  border-top: 1px solid rgba(23, 32, 42, 0.1);
  color: #354b60;
}

:global(.weather-motion-cell) {
  position: absolute;
  width: 54px;
  height: 52px;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(0, 2px, 0) scale(0.88);
  transition:
    opacity 220ms ease-out,
    transform 260ms ease-out;
  will-change: opacity, transform;
}

:global(.weather-motion-cell[data-detail-level='local']) {
  width: 46px;
  height: 46px;
}

:global(.weather-motion-cell.is-visible) {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

:global(.weather-motion-cell.is-visible.is-overview) {
  opacity: 0.84;
  transform: translate3d(0, 0, 0) scale(0.72);
}

:global(.weather-motion-cell::before) {
  position: absolute;
  inset: 10px 7px 4px;
  border-radius: 50%;
  content: '';
  filter: blur(7px);
}

:global(.weather-motion-cell--rain::before) {
  background: radial-gradient(circle, rgba(38, 91, 139, 0.18), rgba(43, 83, 121, 0));
}

:global(.weather-motion-cell--cloud::before) {
  background: radial-gradient(circle, rgba(98, 113, 128, 0.22), rgba(121, 137, 151, 0));
}

:global(.weather-motion-clouds),
:global(.weather-motion-rain) {
  position: absolute;
  overflow: hidden;
  inset: 0;
}

:global(.weather-motion-rain::before) {
  position: absolute;
  inset: -12px 0 0;
  background: repeating-linear-gradient(
    103deg,
    transparent 0 5px,
    rgba(142, 199, 239, 0.2) 6px,
    transparent 7px 11px
  );
  background-size: 100% 18px;
  content: '';
  filter: drop-shadow(0 0 2px rgba(102, 167, 217, 0.24));
  animation: map-rain-sheet 820ms linear infinite;
}

:global(.weather-motion-clouds i) {
  position: absolute;
  top: var(--cloud-top);
  left: var(--cloud-left);
  width: 29px;
  height: 11px;
  border: 1px solid rgba(238, 244, 249, 0.35);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(227, 234, 240, 0.76), rgba(142, 160, 177, 0.52));
  box-shadow:
    9px -4px 0 1px rgba(209, 220, 229, 0.58),
    19px 1px 0 -2px rgba(156, 173, 188, 0.48),
    0 4px 9px rgba(45, 61, 76, 0.16);
  filter: blur(0.7px);
  animation: map-cloud-drift 6.8s ease-in-out var(--cloud-delay) infinite alternate;
}

:global(.weather-motion-cell--rain .weather-motion-clouds) {
  opacity: 0.6;
  transform: scale(0.92) translateY(-2px);
}

:global(.weather-motion-cell--cloud .weather-motion-clouds) {
  opacity: 0.92;
}

:global(.weather-motion-cell--cloud .weather-motion-rain),
:global(.weather-motion-cell:not(.weather-motion-cell--rain) .weather-motion-rain) {
  display: none;
}

:global(.weather-motion-rain) {
  top: 16px;
  height: 36px;
  mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent);
}

:global(.weather-motion-rain i) {
  position: absolute;
  top: -12px;
  left: var(--rain-x);
  width: 1px;
  height: var(--rain-length);
  border-radius: 999px;
  background: linear-gradient(to bottom, rgba(225, 242, 255, 0), rgba(130, 190, 235, 0.86));
  box-shadow: 0 0 3px rgba(111, 176, 225, 0.34);
  transform: rotate(11deg);
  animation: map-rain-fall var(--rain-duration) linear var(--rain-delay) infinite;
}

:global(.weather-motion-rain i:nth-child(3n)) {
  width: 1px;
  opacity: 0.55;
  filter: blur(0.4px);
}

@keyframes map-rain-fall {
  to {
    transform: translate3d(-6px, 48px, 0) rotate(11deg);
  }
}

@keyframes map-rain-sheet {
  to {
    transform: translate3d(-5px, 38px, 0);
  }
}

@keyframes map-cloud-drift {
  from {
    transform: translate3d(-2px, 0, 0) scale(0.96);
  }
  to {
    transform: translate3d(3px, 1px, 0) scale(1.03);
  }
}

:deep(.maplibregl-popup-content) {
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 28px rgba(22, 34, 46, 0.16);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
}

:deep(.maplibregl-ctrl-group) {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  background: var(--glass);
  box-shadow: 0 8px 24px rgba(22, 34, 46, 0.12);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

:deep(.maplibregl-ctrl-group button) {
  width: 44px;
  height: 44px;
}

@supports not (backdrop-filter: blur(1px)) {
  .map-view-toggle,
  .map-mode-controls button,
  .map-motion-toggle,
  .map-caption,
  .weather-legend,
  :deep(.maplibregl-ctrl-group),
  :deep(.maplibregl-popup-content) {
    background: rgba(255, 255, 255, 0.96);
  }
}

@media (hover: hover) and (pointer: fine) {
  .route-strategy-controls button:hover {
    border-color: var(--line-strong);
  }

  .weather-region-list button:hover {
    background: var(--soft);
  }
}

@media (max-width: 680px) {
  .route-map-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-view-toggle {
    align-self: stretch;
  }

  .map-frame {
    min-height: 430px;
  }

  .route-strategy-panel {
    grid-template-columns: 1fr;
  }

  .shade-result {
    align-items: flex-start;
    flex-direction: column;
  }

  .shade-result dl {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-caption {
    right: 10px;
    bottom: 10px;
    max-width: calc(100% - 20px);
  }

  .map-motion-toggle {
    top: 58px;
    right: 10px;
  }

  .weather-region-list {
    grid-template-columns: 1fr;
  }

  .weather-verification .verification-title,
  .verification-heading,
  .verification-map-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .weather-verification summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
    padding-block: 10px;
  }

  .verification-disclosure {
    width: 100%;
    justify-content: space-between;
  }

  .verification-heading p {
    margin-top: 8px;
    text-align: left;
  }

  .verification-map-frame {
    height: 360px;
    border-radius: 14px;
  }

  .verification-actions {
    display: grid;
  }

  .verification-actions a {
    justify-content: space-between;
  }

  .nearby-rain-check ul {
    grid-template-columns: 1fr;
  }

  .nearby-rain-check li:nth-child(odd),
  .nearby-rain-check li:nth-child(even) {
    padding-inline: 0;
    border-right: 0;
  }

  .weather-region-list button:nth-child(odd) {
    border-right: 0;
  }

  .weather-values {
    max-width: 170px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-view-toggle,
  .map-mode-controls button,
  .route-strategy-controls button,
  .map-motion-toggle,
  .motion-switch,
  .motion-switch i,
  .verification-disclosure i,
  :global(.weather-motion-cell) {
    transition: none;
  }

  :global(.weather-motion-rain) {
    display: none;
  }

  :global(.weather-motion-clouds i) {
    animation: none;
  }
}

@media (prefers-contrast: more) {
  :global(.weather-motion-cell) {
    display: none;
  }
}
</style>
