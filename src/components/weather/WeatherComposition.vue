<script setup>
import { computed, ref, watch, watchEffect } from 'vue'

const weatherList = ref([
  { id: 'city-01', name: '서울', temperature: 28, status: '맑음', humidity: 58 },
  { id: 'city-02', name: '수원', temperature: 24, status: '비', humidity: 76 },
  { id: 'city-03', name: '부산', temperature: 26, status: '구름', humidity: 68 },
  { id: 'city-04', name: '광주', temperature: 27, status: '구름 조금', humidity: 63 },
])

const searchQuery = ref('')
const selectedCityInfo = ref(null)
const favoriteCityNames = ref([])

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value

  return weatherList.value.filter((city) => city.name.includes(query))
})

const favoriteCount = computed(() => favoriteCityNames.value.length)
const selectedCityMessage = computed(() => {
  if (!selectedCityInfo.value) return '카드를 선택해 주세요.'
  return `${selectedCityInfo.value.name}이 선택되었습니다.`
})

watch(selectedCityInfo, (city) => {
  if (city) console.log(`[watch] 선택한 도시: ${city.name}`)
})

watch(favoriteCityNames, (cities) => {
  console.log(`[watch] 관심 도시 수: ${cities.length}`)
})

watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어: ${searchQuery.value || '전체'}`)
})

function selectCity(city) {
  selectedCityInfo.value = city
}

function toggleFavorite(cityName) {
  if (favoriteCityNames.value.includes(cityName)) {
    favoriteCityNames.value = favoriteCityNames.value.filter((name) => name !== cityName)
    return
  }

  favoriteCityNames.value.push(cityName)
}

function showDetail(city) {
  window.alert(`${city.name}: ${city.status}, ${city.temperature}°C, 습도 ${city.humidity}%`)
}
</script>

<template>
  <section class="practice-card">
    <h2>날씨 Composition</h2>
    <p>145쪽 요구사항에 맞춰 검색어, 선택 도시, 날씨 목록을 반응형 상태로 관리합니다.</p>

    <label class="search-label">
      도시 검색
      <input v-model="searchQuery" placeholder="예: 수원" />
    </label>
    <p>관심 도시 수: {{ favoriteCount }}</p>
    <p class="result" aria-live="polite">{{ selectedCityMessage }}</p>

    <div v-if="filteredWeatherList.length" class="weather-list">
      <article
        v-for="city in filteredWeatherList"
        :key="city.id"
        class="weather-item"
        :class="{ selected: selectedCityInfo?.id === city.id }"
        @click="selectCity(city)"
      >
        <h3>{{ city.name }}</h3>
        <p>{{ city.status }} / {{ city.temperature }}°C / 습도 {{ city.humidity }}%</p>
        <strong v-if="city.temperature >= 25">더움</strong>
        <strong v-else>선선함</strong>
        <div class="button-row">
          <button type="button" @click.stop="showDetail(city)">상세보기</button>
          <button type="button" @click.stop="toggleFavorite(city.name)">
            {{ favoriteCityNames.includes(city.name) ? '관심 해제' : '관심 도시' }}
          </button>
        </div>
      </article>
    </div>
    <p v-else class="result">검색 결과와 일치하는 도시가 없습니다.</p>
  </section>
</template>

<style scoped>
.search-label {
  display: grid;
  gap: 0.4rem;
  width: min(100%, 320px);
}

.weather-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.weather-item {
  padding: 12px;
  border: 1px solid;
}

.weather-item.selected {
  border-width: 2px;
  font-weight: bold;
}

.weather-item h3 {
  margin: 0;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
</style>
