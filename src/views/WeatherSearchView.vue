<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { weatherCities } from '../data/weatherCities'
import { requestWeatherBundle } from '../services/weatherApi'
import { useConfigStore } from '../stores/configStore'
import { formatTemperature } from '../utils/temperature'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const query = ref(typeof route.query.search === 'string' ? route.query.search : '')
const favoriteOnly = ref(route.query.favorite === '1')
const status = ref('loading')
const cityWeather = ref(new Map())
const failedCount = ref(0)

const filteredCities = computed(() => {
  const keyword = query.value.trim()
  const searched = keyword
    ? weatherCities.filter((city) => `${city.name} ${city.region}`.includes(keyword))
    : weatherCities
  return favoriteOnly.value ? searched.filter((city) => configStore.isFavorite(city.id)) : searched
})

function replaceQuery() {
  router.replace({
    name: 'weather-search',
    query: {
      ...(query.value.trim() ? { search: query.value.trim() } : {}),
      ...(favoriteOnly.value ? { favorite: '1' } : {}),
    },
  })
}

function updateQuery(value) {
  query.value = value
  replaceQuery()
}

function toggleFavoriteFilter() {
  favoriteOnly.value = !favoriteOnly.value
  replaceQuery()
}

function temperature(city) {
  const value = cityWeather.value.get(city.id)?.current.temperature
  return Number.isFinite(value)
    ? formatTemperature(value, configStore.unit, configStore.unitSymbol)
    : '–'
}

function precipitation(city) {
  const value = cityWeather.value.get(city.id)?.current.precipitationProbability
  return Number.isFinite(value) ? `${value}%` : '–'
}

async function loadCities() {
  configStore.clearWeatherEffect()
  status.value = 'loading'
  failedCount.value = 0
  const results = await Promise.allSettled(weatherCities.map((city) => requestWeatherBundle(city)))
  const nextMap = new Map()
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') nextMap.set(weatherCities[index].id, result.value)
  })
  cityWeather.value = nextMap
  failedCount.value = weatherCities.length - nextMap.size
  status.value = nextMap.size ? 'success' : 'error'
}

function syncWeatherEffect() {
  if (status.value !== 'success' || filteredCities.value.length !== 1) {
    configStore.clearWeatherEffect()
    return
  }

  const selectedCity = filteredCities.value[0]
  const selectedWeather = cityWeather.value.get(selectedCity.id)?.current
  if (selectedWeather) configStore.setWeatherEffect(selectedCity.name, selectedWeather)
}

watch(
  () => route.query.search,
  (value) => {
    const next = typeof value === 'string' ? value : ''
    if (next !== query.value) query.value = next
  },
)

watch([filteredCities, cityWeather, status], syncWeatherEffect)

watch(
  () => route.query.favorite,
  (value) => {
    favoriteOnly.value = value === '1'
  },
)

onMounted(loadCities)
</script>

<template>
  <div class="city-view">
    <header class="page-intro">
      <h1>도시 날씨</h1>
      <span>지역별 현재 날씨와 관심 도시를 확인합니다.</span>
    </header>

    <div class="search-row">
      <label for="city-search">도시 또는 지역 검색</label>
      <input
        id="city-search"
        :value="query"
        type="search"
        placeholder="예: 창원, 강원"
        @input="updateQuery($event.target.value)"
      />
      <span>{{ filteredCities.length }}개 도시</span>
    </div>

    <button
      class="favorite-filter"
      type="button"
      :aria-pressed="favoriteOnly"
      @click="toggleFavoriteFilter"
    >
      {{ favoriteOnly ? '전체 도시 보기' : `관심 도시만 보기 (${configStore.favoriteCityCount})` }}
    </button>

    <div v-if="status === 'loading'" class="loading-list">실시간 날씨를 불러오고 있습니다.</div>
    <div v-else-if="status === 'error'" class="loading-list">
      <p>현재 데이터를 불러오지 못했습니다.</p>
      <button type="button" @click="loadCities">다시 시도하기</button>
    </div>
    <div v-else-if="filteredCities.length" class="city-list">
      <article v-for="city in filteredCities" :key="city.id" class="city-row">
        <RouterLink :to="{ name: 'weather-detail', params: { cityId: city.id } }" class="city-link">
          <span class="region">{{ city.shortRegion }}</span>
          <span class="city-name">
            <strong>{{ city.name }}</strong>
            <small>{{ city.place }}</small>
          </span>
          <span class="condition">{{
            cityWeather.get(city.id)?.current.condition ?? '확인 실패'
          }}</span>
          <span class="rain">비 {{ precipitation(city) }}</span>
          <span class="temperature">{{ temperature(city) }}</span>
          <span aria-hidden="true">→</span>
        </RouterLink>
        <button
          class="favorite-button"
          type="button"
          :aria-label="`${city.name} 관심 도시 ${configStore.isFavorite(city.id) ? '해제' : '추가'}`"
          :aria-pressed="configStore.isFavorite(city.id)"
          @click="configStore.toggleFavorite(city.id)"
        >
          {{ configStore.isFavorite(city.id) ? '저장됨' : '관심' }}
        </button>
      </article>
      <p v-if="failedCount" class="partial-notice" role="status">
        {{ failedCount }}개 도시는 응답이 없어 기본 정보만 표시했습니다.
      </p>
    </div>
    <div v-else class="loading-list">
      {{ favoriteOnly ? '저장한 관심 도시가 없습니다.' : '검색어와 일치하는 도시가 없습니다.' }}
    </div>
  </div>
</template>

<style scoped>
.city-view {
  padding-top: 64px;
}
.page-intro {
  max-width: 720px;
}
.page-intro h1 {
  margin: 0;
  font-size: clamp(40px, 7vw, 66px);
  letter-spacing: -0.06em;
}
.page-intro span {
  color: var(--muted);
}
.search-row {
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 18px;
  align-items: center;
  margin-top: 48px;
  padding: 18px 0;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}
.search-row label {
  font-size: 13px;
  font-weight: 800;
}
.search-row input {
  width: 100%;
  padding: 12px 0;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: #fff;
  font-size: 18px;
}
.search-row span {
  color: var(--muted);
  font-size: 13px;
}
.favorite-filter,
.favorite-button,
.loading-list button {
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}
.favorite-filter {
  margin-top: 14px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
}
.city-list {
  overflow: hidden;
  margin-top: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}
.city-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid var(--line);
}
.city-row:last-of-type {
  border-bottom: 0;
}
.city-link {
  display: grid;
  min-width: 0;
  grid-template-columns: 70px 1.3fr 1fr 90px 80px 24px;
  gap: 16px;
  align-items: center;
  padding: 24px 14px;
  color: var(--ink);
  text-decoration: none;
}
.favorite-button {
  min-width: 58px;
  margin-right: 12px;
}
.region,
.condition,
.rain {
  color: var(--muted);
  font-size: 14px;
}
.city-name {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.city-name strong {
  font-size: 20px;
}
.city-name small {
  color: var(--muted);
}
.temperature {
  font-size: 21px;
  font-weight: 800;
  text-align: right;
}
.loading-list {
  margin-top: 24px;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  color: var(--muted);
}
.loading-list p {
  margin: 0 0 12px;
}
.partial-notice {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 13px;
}
@media (hover: hover) and (pointer: fine) {
  .city-row:hover {
    background: var(--soft);
  }
}
@media (max-width: 720px) {
  .city-view {
    padding-top: 38px;
  }
  .search-row {
    grid-template-columns: 1fr auto;
  }
  .search-row label {
    grid-column: 1 / -1;
  }
  .city-link {
    grid-template-columns: 46px 1fr auto;
    gap: 10px;
    padding: 18px 4px;
  }
  .condition,
  .rain {
    grid-column: 2;
  }
  .temperature {
    grid-column: 3;
    grid-row: 1 / 4;
  }
  .city-link > span:last-child {
    display: none;
  }
  .favorite-button {
    min-width: 52px;
    margin-right: 0;
  }
}
</style>
