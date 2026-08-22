<script setup>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  origin: { type: Object, required: true },
  destination: { type: Object, required: true },
  route: { type: Object, required: true },
  weatherGrid: { type: Array, default: () => [] },
  weatherGridStatus: { type: String, default: 'loading' },
  weatherGridError: { type: String, default: '' },
})

const emit = defineEmits(['mode-change', 'retry-weather-grid'])
const mapContainer = ref(null)
const mapStatus = ref('loading')
const mapError = ref('')
const mapMode = ref('route')
const isThreeDimensional = ref(false)
let map
let loadTimer
let weatherPopup

const coordinates = computed(() => {
  if (props.route.geometry?.length >= 2) return props.route.geometry
  return [
    [props.origin.longitude, props.origin.latitude],
    [props.destination.longitude, props.destination.latitude],
  ]
})

const routeGeoJson = computed(() => ({
  type: 'Feature',
  properties: { source: props.route.source },
  geometry: { type: 'LineString', coordinates: coordinates.value },
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

const weatherGeoJson = computed(() => ({
  type: 'FeatureCollection',
  features: props.weatherGrid.map((point) => ({
    type: 'Feature',
    properties: {
      id: point.id,
      name: point.name,
      condition: point.condition,
      kind: point.kind,
      temperature: point.temperature,
      precipitation: point.precipitation,
      rainAmount: point.rainAmount,
      cloudCover: point.cloudCover,
      isRaining: point.isRaining,
      isCloudy: point.isCloudy,
    },
    geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
  })),
}))

const rainRegions = computed(() => props.weatherGrid.filter((point) => point.isRaining))
const cloudyRegions = computed(() => props.weatherGrid.filter((point) => point.isCloudy))
const visibleWeatherRegions = computed(() => {
  if (mapMode.value === 'rain') return rainRegions.value
  if (mapMode.value === 'cloud') return cloudyRegions.value
  if (mapMode.value === 'weather') return props.weatherGrid
  return []
})

const routeSummary = computed(
  () =>
    `${props.origin.name}에서 ${props.destination.name}까지 ${props.route.distance}km, 약 ${props.route.minutes}분입니다. ${props.route.source}를 사용했습니다.`,
)

const mapTitle = computed(() => {
  if (mapMode.value === 'rain') return '지금 비 오는 지역'
  if (mapMode.value === 'cloud') return '지금 흐린 지역'
  if (mapMode.value === 'weather') return '한국 주요 지점 현재 날씨'
  return `${props.origin.name}에서 ${props.destination.name}까지`
})

const mapSummary = computed(() => {
  if (mapMode.value === 'rain') return `현재 비가 확인된 지점 ${rainRegions.value.length}곳입니다.`
  if (mapMode.value === 'cloud')
    return `현재 운량이 높은 지점 ${cloudyRegions.value.length}곳입니다.`
  if (mapMode.value === 'weather')
    return `한국 주요 ${props.weatherGrid.length}개 지점의 현재 날씨입니다.`
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

const emptyWeatherMessage = computed(() =>
  mapMode.value === 'rain'
    ? '현재 확인된 지점에는 비가 없습니다.'
    : '현재 확인된 지점에는 흐린 곳이 없습니다.',
)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setLayerVisibility(layerId, visible) {
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function weatherFilter() {
  if (mapMode.value === 'rain') return ['==', ['get', 'isRaining'], true]
  if (mapMode.value === 'cloud') return ['==', ['get', 'isCloudy'], true]
  return ['has', 'id']
}

function applyMapMode() {
  if (!map || mapStatus.value !== 'ready') return
  const routeVisible = mapMode.value === 'route'
  const weatherVisible = !routeVisible

  ;['route-shadow', 'route-line', 'route-points-halo', 'route-points'].forEach((layerId) =>
    setLayerVisibility(layerId, routeVisible),
  )
  setLayerVisibility('destination-buildings', routeVisible)
  setLayerVisibility(
    'weather-cloud-area',
    weatherVisible && (mapMode.value === 'weather' || mapMode.value === 'cloud'),
  )
  setLayerVisibility(
    'weather-rain-area',
    weatherVisible && (mapMode.value === 'weather' || mapMode.value === 'rain'),
  )
  ;['weather-points-halo', 'weather-points', 'weather-labels'].forEach((layerId) => {
    setLayerVisibility(layerId, weatherVisible)
    if (map.getLayer(layerId)) map.setFilter(layerId, weatherFilter())
  })
}

function addRouteLayers() {
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
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 18, 9, 42],
      'circle-color': '#7c8996',
      'circle-opacity': ['interpolate', ['linear'], ['get', 'cloudCover'], 60, 0.12, 100, 0.34],
      'circle-blur': 0.72,
    },
  })
  map.addLayer({
    id: 'weather-rain-area',
    type: 'circle',
    source: 'weather-grid',
    filter: ['==', ['get', 'isRaining'], true],
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'rainAmount'], 0, 15, 0.5, 24, 5, 38],
      'circle-color': '#2f75b9',
      'circle-opacity': 0.48,
      'circle-blur': 0.38,
    },
  })
  map.addLayer({
    id: 'weather-points-halo',
    type: 'circle',
    source: 'weather-grid',
    layout: { visibility: 'none' },
    paint: { 'circle-radius': 9, 'circle-color': 'rgba(255,255,255,0.9)' },
  })
  map.addLayer({
    id: 'weather-points',
    type: 'circle',
    source: 'weather-grid',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': 6,
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
    },
  })
  map.addLayer({
    id: 'weather-labels',
    type: 'symbol',
    source: 'weather-grid',
    minzoom: 5.4,
    layout: {
      visibility: 'none',
      'text-field': ['get', 'name'],
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
  applyMapMode()
  map.easeTo({
    center: [props.destination.longitude, props.destination.latitude],
    zoom: 16.2,
    pitch: 52,
    bearing: -18,
    duration: prefersReducedMotion() ? 0 : 650,
  })
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
  container.append(title, details)
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

function updateMapData() {
  if (!map || mapStatus.value !== 'ready') return
  map.getSource('route')?.setData(routeGeoJson.value)
  map.getSource('route-points')?.setData(pointGeoJson.value)
  if (mapMode.value === 'route') showWholeRoute()
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
        showWholeRoute()
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
  } catch {
    mapStatus.value = 'error'
    mapError.value = '이 브라우저에서는 3D 지도를 표시할 수 없습니다.'
  }
})

watch([coordinates, pointGeoJson], updateMapData)
watch(weatherGeoJson, updateWeatherData)

onBeforeUnmount(() => {
  window.clearTimeout(loadTimer)
  weatherPopup?.remove()
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
        v-if="mapStatus === 'ready' && mapMode === 'route'"
        class="map-view-toggle"
        type="button"
        :aria-pressed="isThreeDimensional"
        @click="toggleView"
      >
        {{ isThreeDimensional ? '전체 경로 보기' : '목적지 3D 보기' }}
      </button>
    </header>

    <div class="map-mode-controls" role="group" aria-label="지도 보기">
      <button type="button" :aria-pressed="mapMode === 'route'" @click="showWholeRoute">
        이동 경로
      </button>
      <button
        type="button"
        :aria-pressed="mapMode === 'weather'"
        :disabled="weatherGridStatus !== 'success'"
        @click="showWeatherMode('weather')"
      >
        전체 날씨 <span>{{ weatherGrid.length }}</span>
      </button>
      <button
        type="button"
        :aria-pressed="mapMode === 'rain'"
        :disabled="weatherGridStatus !== 'success'"
        @click="showWeatherMode('rain')"
      >
        비 오는 지역 <span>{{ rainRegions.length }}</span>
      </button>
      <button
        type="button"
        :aria-pressed="mapMode === 'cloud'"
        :disabled="weatherGridStatus !== 'success'"
        @click="showWeatherMode('cloud')"
      >
        흐린 지역 <span>{{ cloudyRegions.length }}</span>
      </button>
    </div>

    <div v-if="weatherGridStatus === 'loading'" class="weather-layer-status" role="status">
      전국 기상 지점을 불러오고 있습니다.
    </div>
    <div v-else-if="weatherGridStatus === 'error'" class="weather-layer-status" role="status">
      <span>{{ weatherGridError }}</span>
      <button type="button" @click="emit('retry-weather-grid')">다시 불러오기</button>
    </div>

    <div class="map-frame">
      <div ref="mapContainer" class="map-canvas" role="region" :aria-label="mapAriaLabel"></div>
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
      <div v-if="mapMode !== 'route'" class="weather-legend" aria-label="기상 지도 범례">
        <span><i class="legend-rain"></i>비</span>
        <span><i class="legend-cloud"></i>흐림</span>
        <span><i class="legend-clear"></i>맑음</span>
      </div>
      <p class="map-caption">
        <template v-if="mapMode === 'route'">
          3D 건물은 경로를 이해하기 위한 지도 정보이며, 그늘을 계산한 결과는 아닙니다.
        </template>
        <template v-else>
          Open-Meteo 현재 모델값을 지점별로 표시하며 기상 레이더 경계는 아닙니다.
          {{ weatherUpdatedAt ? `${weatherUpdatedAt} 기준` : '' }}
        </template>
      </p>
    </div>

    <section v-if="mapMode !== 'route'" class="weather-region-panel" aria-live="polite">
      <header>
        <strong>{{ mapTitle }}</strong>
        <span>{{ visibleWeatherRegions.length }}개 지점</span>
      </header>
      <div v-if="visibleWeatherRegions.length" class="weather-region-list">
        <button
          v-for="point in visibleWeatherRegions"
          :key="point.id"
          type="button"
          @click="focusWeatherRegion(point)"
        >
          <span>
            <strong>{{ point.name }}</strong>
            <small>{{ point.condition }}</small>
          </span>
          <span class="weather-values">
            {{ Math.round(point.temperature) }}℃ · 강수 {{ point.rainAmount }}mm · 운량
            {{ point.cloudCover }}%
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
.map-mode-controls button {
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
  border-radius: 20px;
  background: var(--soft);
}

.map-canvas {
  position: absolute;
  inset: 0;
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
  .map-caption,
  .weather-legend,
  :deep(.maplibregl-ctrl-group),
  :deep(.maplibregl-popup-content) {
    background: rgba(255, 255, 255, 0.96);
  }
}

@media (hover: hover) and (pointer: fine) {
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

  .map-caption {
    right: 10px;
    bottom: 10px;
    max-width: calc(100% - 20px);
  }

  .weather-region-list {
    grid-template-columns: 1fr;
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
  .map-mode-controls button {
    transition: none;
  }
}
</style>
