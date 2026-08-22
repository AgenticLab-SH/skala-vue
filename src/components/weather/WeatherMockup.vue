<script setup>
import { ref } from 'vue'

const weatherList = ref([
  { id: 'city-01', name: '서울', temperature: 28, status: '맑음', humidity: 58 },
  { id: 'city-02', name: '수원', temperature: 24, status: '비', humidity: 76 },
  { id: 'city-03', name: '부산', temperature: 26, status: '구름', humidity: 68 },
  { id: 'city-04', name: '광주', temperature: 27, status: '구름 조금', humidity: 63 },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 선택해 주세요.')

function selectCity(city) {
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

function showDetail(city) {
  window.alert(`${city.name}의 현재 날씨는 ${city.status}, ${city.temperature}°C입니다.`)
}
</script>

<template>
  <section class="practice-card">
    <h2>날씨 목업</h2>
    <p>116쪽의 v-for, v-if, :value, @input, 이벤트 수식어를 한 화면에 적용했습니다.</p>

    <label class="search-label">
      도시 이름 입력
      <input
        :value="searchQuery"
        placeholder="예: 광주"
        @input="searchQuery = $event.target.value"
      />
    </label>
    <p>입력한 도시: {{ searchQuery || '없음' }}</p>

    <div class="weather-list">
      <article
        v-for="city in weatherList"
        :key="city.id"
        class="weather-item"
        @click="selectCity(city)"
      >
        <h3>{{ city.name }}</h3>
        <p>{{ city.status }} / {{ city.temperature }}°C / 습도 {{ city.humidity }}%</p>
        <strong v-if="city.temperature >= 25">더움 (25도 이상)</strong>
        <strong v-else>선선함 (25도 미만)</strong>
        <button type="button" @click.stop="showDetail(city)">상세보기</button>
      </article>
    </div>

    <p class="result" aria-live="polite">{{ selectedCityInfo }}</p>
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

.weather-item h3 {
  margin: 0;
}

.weather-item button {
  margin-top: 10px;
}
</style>
