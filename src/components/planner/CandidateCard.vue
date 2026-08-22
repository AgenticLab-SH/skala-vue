<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'
import { formatTemperature } from '../../utils/temperature'
import { getScoreLabel } from '../../utils/weatherScore'

const props = defineProps({
  item: { type: Object, required: true },
  rank: { type: Number, required: true },
})

defineEmits(['select'])

const configStore = useConfigStore()
const travelText = computed(() => {
  const minutes = props.item.route.minutes
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`
})
const temperatureText = computed(() =>
  formatTemperature(props.item.weather.temperature, configStore.unit, configStore.unitSymbol),
)
</script>

<template>
  <button class="candidate" type="button" @click="$emit('select', item)">
    <span class="rank">0{{ rank }}</span>
    <span class="candidate-main">
      <span class="region">{{ item.city.region }}</span>
      <strong>{{ item.city.name }} · {{ item.city.place }}</strong>
      <span class="weather">
        {{ item.weather.condition }} · {{ temperatureText }} · 비
        {{ item.weather.precipitationProbability }}%
      </span>
    </span>
    <span class="candidate-side">
      <strong>{{ item.score }}</strong>
      <span>{{ getScoreLabel(item.score) }} · {{ travelText }}</span>
    </span>
  </button>
</template>

<style scoped>
.candidate {
  display: grid;
  width: 100%;
  grid-template-columns: 44px 1fr auto;
  gap: 14px;
  padding: 22px 0;
  border: 0;
  border-top: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  text-align: left;
}

.rank,
.region,
.weather,
.candidate-side span {
  color: var(--muted);
  font-size: 13px;
}

.candidate-main,
.candidate-side {
  display: flex;
  flex-direction: column;
}

.candidate-main {
  gap: 4px;
}

.candidate-main strong {
  font-size: 18px;
}

.candidate-side {
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
}

.candidate-side strong {
  font-size: 26px;
}

@media (hover: hover) and (pointer: fine) {
  .candidate:hover {
    background: var(--soft);
  }
}

@media (max-width: 560px) {
  .candidate {
    grid-template-columns: 34px 1fr;
  }

  .candidate-side {
    grid-column: 2;
    align-items: flex-start;
  }
}
</style>
