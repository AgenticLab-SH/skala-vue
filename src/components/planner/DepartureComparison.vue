<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'
import { formatTemperature } from '../../utils/temperature'

const props = defineProps({ alternatives: { type: Array, required: true } })

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
        <h2>경로보다 시간을 바꾸는 게 나을까요?</h2>
        <span>같은 목적지의 도착 시각별 예보를 다시 계산했습니다.</span>
      </div>
    </div>

    <div class="time-grid">
      <article
        v-for="item in alternatives"
        :key="item.delay"
        :class="{ best: item.score === bestScore }"
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
        <span v-if="item.score === bestScore" class="best-label">가장 나은 시간</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.departure-comparison {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}

.section-heading {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.section-heading h2,
.section-heading span {
  margin: 0;
}

.section-heading h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
}

.section-heading span {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 14px;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

article {
  position: relative;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
}

article.best {
  border-color: var(--ink);
  background: var(--soft);
}

article > p {
  margin: 0 0 7px;
  color: var(--muted);
  font-size: 13px;
}

article > strong {
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

@media (max-width: 680px) {
  .departure-comparison {
    padding: 22px 18px;
  }

  .time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
