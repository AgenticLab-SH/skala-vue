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
</script>

<template>
  <section class="departure-comparison">
    <div class="section-heading">
      <div>
        <h2>출발 시간을 바꿔 볼까요?</h2>
        <p>같은 목적지의 도착 날씨를 비교했습니다. 시간을 누르면 그 조건으로 다시 추천합니다.</p>
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
        <p>{{ item.delay === 0 ? '선택한 시간' : `${item.delay / 60}시간 늦게` }}</p>
        <strong>{{ formatTime(item.departureAt) }} 출발</strong>
        <dl>
          <div>
            <dt>도착</dt>
            <dd>{{ formatTime(item.arrivalAt) }}</dd>
          </div>
          <div>
            <dt>비</dt>
            <dd>{{ item.weather.precipitationProbability }}%</dd>
          </div>
          <div>
            <dt>기온</dt>
            <dd>{{ temperatureText(item.weather.temperature) }}</dd>
          </div>
          <div>
            <dt>적합도</dt>
            <dd>{{ item.score }}점</dd>
          </div>
        </dl>
        <span v-if="item.score === bestScore" class="best-label">현재 비교에서 가장 적합</span>
        <span class="apply-label">이 시간으로 다시 보기 →</span>
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
  grid-template-columns: repeat(3, 1fr);
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
  font-size: 19px;
}

dl {
  margin: 18px 0 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  font-weight: 700;
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
    grid-template-columns: 1fr;
  }
}
</style>
