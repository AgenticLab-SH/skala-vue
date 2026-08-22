<script setup>
import { computed } from 'vue'

import { findActivity } from '../../data/activities'
import { useConfigStore } from '../../stores/configStore'
import { formatTemperature } from '../../utils/temperature'
import { getScoreLabel } from '../../utils/weatherScore'

const props = defineProps({
  recommendation: { type: Object, required: true },
  originName: { type: String, required: true },
  activityId: { type: String, required: true },
})

defineEmits(['open-detail'])

const configStore = useConfigStore()
const activity = computed(() => findActivity(props.activityId))
const arrivalText = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(props.recommendation.arrivalAt),
)
const travelText = computed(() => {
  const minutes = props.recommendation.route.minutes
  const hour = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hour ? `${hour}시간 ${rest ? `${rest}분` : ''}` : `${rest}분`
})

const destinationText = computed(() => {
  const name = props.recommendation.city.name
  const lastCode = name.charCodeAt(name.length - 1) - 0xac00
  if (lastCode < 0 || lastCode > 11171) return `${name}로`
  const finalConsonant = lastCode % 28
  return `${name}${finalConsonant !== 0 && finalConsonant !== 8 ? '으로' : '로'}`
})
const temperatureText = computed(() =>
  formatTemperature(
    props.recommendation.weather.temperature,
    configStore.unit,
    configStore.unitSymbol,
  ),
)
</script>

<template>
  <article class="recommendation">
    <div class="recommendation-copy">
      <p class="eyebrow">가장 나은 선택 · {{ getScoreLabel(recommendation.score) }}</p>
      <h2>{{ destinationText }} 가는 편이 좋습니다.</h2>
      <p class="lead">
        {{ originName }}에서 {{ travelText }} 정도 이동하면 <strong>{{ activity.label }}</strong
        >하기 좋은 날씨를 만날 수 있습니다.
      </p>

      <ul class="reason-list">
        <li v-for="reason in recommendation.reasons" :key="reason">{{ reason }}</li>
      </ul>

      <button class="text-action" type="button" @click="$emit('open-detail')">
        {{ recommendation.city.place }} 날씨 자세히 보기 →
      </button>
    </div>

    <div class="score-panel">
      <p class="score-label">{{ activity.label }} 적합도</p>
      <p class="score">
        <strong>{{ recommendation.score }}</strong
        ><span>/ 100</span>
      </p>
      <dl>
        <div>
          <dt>도착 예상</dt>
          <dd>{{ arrivalText }}</dd>
        </div>
        <div>
          <dt>예상 날씨</dt>
          <dd>{{ recommendation.weather.condition }}</dd>
        </div>
        <div>
          <dt>기온</dt>
          <dd>{{ temperatureText }}</dd>
        </div>
        <div>
          <dt>강수확률</dt>
          <dd>{{ recommendation.weather.precipitationProbability }}%</dd>
        </div>
      </dl>
      <p class="route-source">
        {{ recommendation.route.source }} · {{ recommendation.route.distance }}km
      </p>
    </div>
  </article>
</template>

<style scoped>
.recommendation {
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.75fr);
  border: 1px solid var(--line-strong);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 14px 36px rgba(25, 38, 52, 0.07);
}

.recommendation-copy,
.score-panel {
  padding: 38px;
}

.score-panel {
  border-left: 1px solid var(--line);
  background: var(--soft);
}

.eyebrow,
.score-label,
.route-source {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

h2 {
  max-width: 600px;
  margin: 12px 0;
  font-size: clamp(30px, 5vw, 50px);
  line-height: 1.12;
  letter-spacing: -0.055em;
}

.lead {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.7;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 0;
  margin: 24px 0;
  list-style: none;
}

.reason-list li::before {
  content: '✓';
  margin-right: 7px;
  color: var(--accent);
  font-weight: 900;
}

.text-action {
  padding: 0 0 4px;
  border: 0;
  border-bottom: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}

.score {
  display: flex;
  align-items: baseline;
  margin: 12px 0 30px;
}

.score strong {
  font-size: 64px;
  line-height: 1;
  letter-spacing: -0.06em;
}

.score span {
  margin-left: 6px;
  color: var(--muted);
}

dl {
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}

.route-source {
  margin-top: 18px;
  font-weight: 500;
  letter-spacing: 0;
}

@media (max-width: 760px) {
  .recommendation {
    grid-template-columns: 1fr;
  }

  .recommendation-copy,
  .score-panel {
    padding: 26px 20px;
  }

  .score-panel {
    border-top: 1px solid var(--line);
    border-left: 0;
  }
}
</style>
