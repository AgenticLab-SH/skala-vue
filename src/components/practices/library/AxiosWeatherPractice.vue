<script setup>
import { computed, ref } from 'vue'

import { weatherCities } from '../../../data/weatherCities'
import { requestWeatherBundle } from '../../../services/weatherApi'

const selectedCityId = ref('seoul')
const requestState = ref('idle')
const result = ref(null)
const errorMessage = ref('')
const selectedCity = computed(() => weatherCities.find((city) => city.id === selectedCityId.value))

async function loadWeather() {
  requestState.value = 'loading'
  errorMessage.value = ''
  result.value = null
  try {
    result.value = await requestWeatherBundle(selectedCity.value, { force: true })
    requestState.value = 'success'
  } catch {
    requestState.value = 'error'
    errorMessage.value = '날씨 요청을 완료하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
  }
}
</script>

<template>
  <section class="practice-card" aria-live="polite">
    <h2>Axios Weather 요청</h2>
    <div class="control-row">
      <select v-model="selectedCityId" aria-label="날씨를 요청할 도시">
        <option v-for="city in weatherCities" :key="city.id" :value="city.id">
          {{ city.name }}
        </option>
      </select>
      <el-button :loading="requestState === 'loading'" @click="loadWeather">
        현재 날씨 요청
      </el-button>
    </div>

    <el-alert
      v-if="requestState === 'error'"
      :closable="false"
      :title="errorMessage"
      type="error"
    />
    <dl v-else-if="result">
      <div>
        <dt>제공자</dt>
        <dd>{{ result.source }}</dd>
      </div>
      <div>
        <dt>도시</dt>
        <dd>{{ result.cityName }}</dd>
      </div>
      <div>
        <dt>날씨</dt>
        <dd>{{ result.current.condition }}</dd>
      </div>
      <div>
        <dt>기온</dt>
        <dd>{{ Math.round(result.current.temperature) }}℃</dd>
      </div>
    </dl>
    <p v-else class="muted">버튼을 누르면 Axios GET 요청 결과가 표시됩니다.</p>
  </section>
</template>

<style scoped>
.control-row {
  margin-bottom: 12px;
}

select {
  min-width: 160px;
  min-height: 40px;
}

dl {
  margin: 14px 0 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

dd {
  margin: 0;
  font-weight: 700;
}
</style>
