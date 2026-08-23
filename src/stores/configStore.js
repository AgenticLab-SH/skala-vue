import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { createWeatherEffect, emptyWeatherEffect } from '../utils/weatherEffects'

function readInitialConfig() {
  const saved =
    typeof localStorage === 'undefined' ? null : localStorage.getItem('cloud-route-config')
  try {
    return saved ? JSON.parse(saved) : {}
  } catch {
    // 이전 저장값이 깨진 경우 기본값으로 시작해 화면 진입을 막지 않습니다.
    return {}
  }
}

const travelMinuteOptions = new Set([30, 60, 120, 180, 240, 300])

function normalizeTravelMinutes(value) {
  const minutes = Number(value)
  if (travelMinuteOptions.has(minutes)) return minutes
  if (minutes > 300) return 300
  return 240
}

export const useConfigStore = defineStore('config', () => {
  const initial = readInitialConfig()

  // 여러 화면에서 같은 선택을 이어서 볼 수 있도록 검색 조건도 store에 함께 둡니다.
  const unit = ref(initial.unit ?? 'celsius')
  const favoriteCityIds = ref(initial.favoriteCityIds ?? [])
  const weatherEffectsEnabled = ref(initial.weatherEffectsEnabled ?? true)
  const mapWeatherMotionEnabled = ref(initial.mapWeatherMotionEnabled ?? true)
  const weatherEffect = ref(emptyWeatherEffect())
  const lastViewedCityId = ref('')
  const planner = ref({
    originId: initial.planner?.originId ?? 'seoul',
    activityId: initial.planner?.activityId ?? 'running',
    maxTravelMinutes: normalizeTravelMinutes(initial.planner?.maxTravelMinutes),
  })

  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))
  const favoriteCityCount = computed(() => favoriteCityIds.value.length)
  const hasWeatherEffect = computed(() => weatherEffect.value.mode !== 'none')

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  function toggleWeatherEffects() {
    weatherEffectsEnabled.value = !weatherEffectsEnabled.value
  }

  function toggleMapWeatherMotion() {
    mapWeatherMotionEnabled.value = !mapWeatherMotionEnabled.value
  }

  function setWeatherEffect(cityName, weather) {
    weatherEffect.value = createWeatherEffect(weather, cityName)
  }

  function clearWeatherEffect() {
    weatherEffect.value = emptyWeatherEffect()
  }

  function isFavorite(cityId) {
    return favoriteCityIds.value.includes(cityId)
  }

  function toggleFavorite(cityId) {
    favoriteCityIds.value = isFavorite(cityId)
      ? favoriteCityIds.value.filter((id) => id !== cityId)
      : [...favoriteCityIds.value, cityId]
  }

  function rememberCity(cityId) {
    lastViewedCityId.value = cityId
  }

  function savePlanner(nextPlanner) {
    planner.value = { ...planner.value, ...nextPlanner }
  }

  watch(
    [unit, favoriteCityIds, planner, weatherEffectsEnabled, mapWeatherMotionEnabled],
    () => {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(
        'cloud-route-config',
        JSON.stringify({
          unit: unit.value,
          favoriteCityIds: favoriteCityIds.value,
          planner: planner.value,
          weatherEffectsEnabled: weatherEffectsEnabled.value,
          mapWeatherMotionEnabled: mapWeatherMotionEnabled.value,
        }),
      )
    },
    { deep: true },
  )

  return {
    unit,
    favoriteCityIds,
    lastViewedCityId,
    unitSymbol,
    favoriteCityCount,
    weatherEffectsEnabled,
    mapWeatherMotionEnabled,
    weatherEffect,
    hasWeatherEffect,
    planner,
    toggleUnit,
    toggleWeatherEffects,
    toggleMapWeatherMotion,
    setWeatherEffect,
    clearWeatherEffect,
    isFavorite,
    toggleFavorite,
    rememberCity,
    savePlanner,
  }
})
