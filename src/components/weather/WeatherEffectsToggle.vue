<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'

const configStore = useConfigStore()

const icon = computed(() => {
  const icons = { sun: '☀', rain: '☂', cloud: '☁', fog: '≋', snow: '❄' }
  return icons[configStore.weatherEffect.mode] ?? '◌'
})

const actionLabel = computed(() => {
  const action = configStore.weatherEffectsEnabled ? '끄기' : '켜기'
  if (!configStore.hasWeatherEffect) return `날씨 화면 효과 ${action}`
  return `${configStore.weatherEffect.cityName} ${configStore.weatherEffect.condition} 화면 효과 ${action}`
})

const statusLabel = computed(() => {
  if (!configStore.weatherEffectsEnabled) return '화면 효과 끔'
  return configStore.hasWeatherEffect ? '화면 효과 켬' : '화면 효과 대기'
})
</script>

<template>
  <button
    class="weather-effect-toggle"
    type="button"
    :aria-label="actionLabel"
    :aria-pressed="configStore.weatherEffectsEnabled"
    :title="actionLabel"
    @click="configStore.toggleWeatherEffects"
  >
    <span class="weather-effect-icon" aria-hidden="true">{{ icon }}</span>
    <span class="weather-effect-label">{{ statusLabel }}</span>
  </button>
</template>

<style scoped>
.weather-effect-toggle {
  display: inline-flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.54);
  color: var(--muted);
}

.weather-effect-toggle[aria-pressed='true'] {
  background: rgba(255, 255, 255, 0.82);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px rgba(23, 32, 42, 0.07);
}

.weather-effect-icon {
  width: 18px;
  font-size: 17px;
  line-height: 1;
  text-align: center;
}

.weather-effect-label {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 920px) {
  .weather-effect-toggle {
    padding: 0;
  }

  .weather-effect-label {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }
}
</style>
