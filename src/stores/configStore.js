import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

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

export const useConfigStore = defineStore('config', () => {
  const initial = readInitialConfig()

  // 여러 화면에서 같은 선택을 이어서 볼 수 있도록 검색 조건도 store에 함께 둡니다.
  const unit = ref(initial.unit ?? 'celsius')
  const favoriteCityIds = ref(initial.favoriteCityIds ?? [])
  const lastViewedCityId = ref('')
  const planner = ref({
    originId: initial.planner?.originId ?? 'seoul',
    activityId: initial.planner?.activityId ?? 'running',
    maxTravelMinutes: initial.planner?.maxTravelMinutes ?? 240,
  })

  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))
  const favoriteCityCount = computed(() => favoriteCityIds.value.length)

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
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
    [unit, favoriteCityIds, planner],
    () => {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(
        'cloud-route-config',
        JSON.stringify({
          unit: unit.value,
          favoriteCityIds: favoriteCityIds.value,
          planner: planner.value,
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
    planner,
    toggleUnit,
    isFavorite,
    toggleFavorite,
    rememberCity,
    savePlanner,
  }
})
