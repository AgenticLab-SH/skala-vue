<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'
import { formatTemperature } from '../../utils/temperature'

const props = defineProps({ alternatives: { type: Array, required: true } })
defineEmits(['select'])

const configStore = useConfigStore()
const bestScore = computed(() => Math.max(...props.alternatives.map((item) => item.score)))

function formatTime(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function temperatureText(value) {
  return formatTemperature(value, configStore.unit, configStore.unitSymbol)
}

function delayLabel(delay) {
  const hours = Math.abs(delay) / 60
  return delay < 0 ? `${hours}시간 빠르게` : `${hours}시간 늦게`
}
</script>

<template>
  <section class="departure-comparison">
    <div class="section-heading">
      <div>
        <h2>출발 시간을 앞뒤로 비교해 보세요.</h2>
        <p>한 시간 간격으로 앞선 시간 3개와 늦은 시간 3개를 비교했습니다.</p>
      </div>
    </div>

    <div class="time-grid">
      <button
        v-for="item in alternatives"
        :key="item.delay"
        type="button"
        :class="{ best: item.score === bestScore }"
        :aria-label="`${formatTime(item.departureAt)} 출발 조건으로 다시 추천`"
        @click="$emit('select', item)"
      >
        <p>{{ delayLabel(item.delay) }}</p>
        <strong>{{ formatTime(item.departureAt) }} 출발</strong>
        <span class="arrival-label">{{ formatTime(item.arrivalAt) }} 도착</span>
        <span class="weather-label">
          비 {{ item.weather.precipitationProbability }}% ·
          {{ temperatureText(item.weather.temperature) }}
        </span>
        <span v-if="item.score === bestScore" class="best-label">날씨가 가장 나음</span>
        <span class="apply-label">이 시간 선택 →</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.departure-comparison {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
}

.section-heading {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.section-heading h2 {
  margin: 0;
}

.section-heading p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}

.section-heading h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

article,
.time-grid > button {
  position: relative;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
}

.time-grid > button {
  min-width: 0;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  text-align: left;
}

.time-grid > button:hover {
  border-color: var(--accent);
  background: rgba(237, 245, 253, 0.72);
}

.time-grid > button.best {
  border-color: var(--ink);
  background: var(--soft);
}

.time-grid > button > p {
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 13px;
}

.time-grid > button > strong {
  display: block;
  font-size: 17px;
}

.arrival-label,
.weather-label {
  display: block;
  margin-top: 9px;
  color: var(--muted);
  font-size: 12px;
}

.weather-label {
  margin-top: 3px;
}

.best-label {
  display: inline-block;
  margin-top: 14px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.apply-label {
  display: block;
  margin-top: 8px;
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 680px) {
  .departure-comparison {
    padding: 22px 18px;
  }

  .time-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 681px) and (max-width: 1080px) {
  .time-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
