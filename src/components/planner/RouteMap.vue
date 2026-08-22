<script setup>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  origin: { type: Object, required: true },
  destination: { type: Object, required: true },
  route: { type: Object, required: true },
})

const mapContainer = ref(null)
const mapStatus = ref('loading')
const mapError = ref('')
const isThreeDimensional = ref(false)
let map
let loadTimer

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
      geometry: {
        type: 'Point',
        coordinates: [props.origin.longitude, props.origin.latitude],
      },
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

const summary = computed(
  () =>
    `${props.origin.name}에서 ${props.destination.name}까지 ${props.route.distance}km, 약 ${props.route.minutes}분입니다. ${props.route.source}를 사용했습니다.`,
)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function addMapLayers() {
  if (!map.getSource('route')) {
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
  }

  if (!map.getSource('route-points')) {
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

  if (!map.getSource('openfreemap-buildings')) {
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
}

function showWholeRoute() {
  if (!map || mapStatus.value !== 'ready') return
  isThreeDimensional.value = false
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
}

function showDestinationIn3d() {
  if (!map || mapStatus.value !== 'ready') return
  isThreeDimensional.value = true
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

function updateMapData() {
  if (!map || mapStatus.value !== 'ready') return
  map.getSource('route')?.setData(routeGeoJson.value)
  map.getSource('route-points')?.setData(pointGeoJson.value)
  showWholeRoute()
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
        addMapLayers()
        window.clearTimeout(loadTimer)
        mapStatus.value = 'ready'
        showWholeRoute()
      } catch {
        window.clearTimeout(loadTimer)
        mapStatus.value = 'error'
        mapError.value = '지도 데이터 일부를 불러오지 못했습니다.'
      }
    })
  } catch {
    mapStatus.value = 'error'
    mapError.value = '이 브라우저에서는 3D 지도를 표시할 수 없습니다.'
  }
})

watch([coordinates, pointGeoJson], updateMapData)

onBeforeUnmount(() => {
  window.clearTimeout(loadTimer)
  map?.remove()
})
</script>

<template>
  <section class="route-map-section" aria-labelledby="route-map-title">
    <header class="route-map-heading">
      <div>
        <p>이동 경로</p>
        <h3 id="route-map-title">{{ origin.name }}에서 {{ destination.name }}까지</h3>
        <span>{{ summary }}</span>
      </div>
      <button
        v-if="mapStatus === 'ready'"
        class="map-view-toggle"
        type="button"
        :aria-pressed="isThreeDimensional"
        @click="toggleView"
      >
        {{ isThreeDimensional ? '전체 경로 보기' : '목적지 3D 보기' }}
      </button>
    </header>

    <div class="map-frame">
      <div
        ref="mapContainer"
        class="map-canvas"
        role="region"
        :aria-label="`경로 지도. ${summary}`"
      ></div>
      <div v-if="mapStatus === 'loading'" class="map-state" role="status">
        지도를 불러오고 있습니다.
      </div>
      <div v-else-if="mapStatus === 'error'" class="map-state" role="status">
        <strong>경로 요약은 확인할 수 있습니다.</strong>
        <span>{{ mapError }}</span>
      </div>
      <p class="map-caption">
        3D 건물은 경로를 이해하기 위한 지도 정보이며, 그늘을 계산한 결과는 아닙니다.
      </p>
    </div>
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

.map-view-toggle {
  min-height: 44px;
  flex: 0 0 auto;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 999px;
  background: var(--glass);
  box-shadow:
    0 8px 24px rgba(22, 34, 46, 0.12),
    inset 0 1px rgba(255, 255, 255, 0.9);
  color: var(--ink);
  font-weight: 750;
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.map-frame {
  position: relative;
  overflow: hidden;
  min-height: 480px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--soft);
}

.map-canvas {
  position: absolute;
  inset: 0;
}

.map-state {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 30px;
  background: var(--soft);
  color: var(--muted);
  text-align: center;
}

.map-state strong {
  color: var(--ink);
}

.map-caption {
  position: absolute;
  z-index: 2;
  right: 14px;
  bottom: 14px;
  max-width: min(430px, calc(100% - 28px));
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
  .map-caption,
  :deep(.maplibregl-ctrl-group) {
    background: rgba(255, 255, 255, 0.96);
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
    min-height: 410px;
  }

  .map-caption {
    right: 10px;
    bottom: 10px;
    max-width: calc(100% - 20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-view-toggle {
    transition: none;
  }
}
</style>
