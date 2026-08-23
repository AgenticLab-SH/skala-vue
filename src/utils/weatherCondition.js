const CONDITION_LABELS = new Map([
  ['구름조금', '구름 조금'],
  ['약간의 구름이 낀 하늘', '구름 조금'],
  ['튼구름', '구름 많음'],
  ['온흐림', '흐림'],
  ['실 비', '약한 비'],
  ['보통 비', '비'],
])

export function normalizeWeatherCondition(condition) {
  const value = String(condition ?? '').trim()
  if (!value) return '정보 없음'
  return CONDITION_LABELS.get(value) ?? value
}

export function normalizeWeatherBundle(bundle) {
  return {
    ...bundle,
    current: bundle.current
      ? {
          ...bundle.current,
          condition: normalizeWeatherCondition(bundle.current.condition),
        }
      : bundle.current,
    forecast: Array.isArray(bundle.forecast)
      ? bundle.forecast.map((item) => ({
          ...item,
          condition: normalizeWeatherCondition(item.condition),
        }))
      : [],
  }
}
