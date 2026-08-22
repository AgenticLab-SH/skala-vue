<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'

const props = defineProps({
  cities: { type: Array, required: true },
})
const configStore = useConfigStore()

const averageTemperature = computed(() => {
  if (props.cities.length === 0) return '-'
  const total = props.cities.reduce((sum, city) => sum + city.temperature, 0)
  const celsius = Math.round((total / props.cities.length) * 10) / 10
  if (configStore.unit === 'fahrenheit') return `${Math.round((celsius * 9) / 5 + 32)}℉`
  return `${celsius}℃`
})
</script>

<template>
  <aside class="weather-summary" aria-live="polite">
    <p>표시 중인 도시: {{ cities.length }}곳</p>
    <p>평균 기온: {{ averageTemperature }}</p>
    <p>관심 도시: {{ configStore.favoriteCityCount }}곳</p>
  </aside>
</template>

<style scoped>
.weather-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 18px 0;
  padding: 10px;
  border: 1px solid #bbb;
}

p {
  margin: 0;
}
</style>
