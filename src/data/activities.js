export const activities = [
  {
    id: 'running',
    label: '러닝',
    icon: '↗',
    ideal: { minTemp: 7, maxTemp: 24, maxRain: 30, maxWind: 9, maxHumidity: 82 },
    planB: '실내 트랙이나 가까운 체육관으로 바꾸는 편이 좋습니다.',
  },
  {
    id: 'hiking',
    label: '등산',
    icon: '△',
    ideal: { minTemp: 6, maxTemp: 25, maxRain: 20, maxWind: 8, maxHumidity: 84 },
    planB: '전망보다 안전이 우선이므로 박물관이나 실내 전시를 추천합니다.',
  },
  {
    id: 'sea',
    label: '바다',
    icon: '≈',
    ideal: { minTemp: 18, maxTemp: 31, maxRain: 25, maxWind: 9, maxHumidity: 90 },
    planB: '해변 대신 바다가 보이는 실내 공간을 선택할 수 있습니다.',
  },
  {
    id: 'futsal',
    label: '풋살',
    icon: '○',
    ideal: { minTemp: 5, maxTemp: 28, maxRain: 20, maxWind: 11, maxHumidity: 86 },
    planB: '실내 풋살장 예약 가능 시간을 먼저 확인하는 편이 좋습니다.',
  },
  {
    id: 'cycling',
    label: '자전거',
    icon: '◇',
    ideal: { minTemp: 8, maxTemp: 27, maxRain: 20, maxWind: 7, maxHumidity: 84 },
    planB: '짧은 산책이나 실내 운동으로 강도를 낮출 수 있습니다.',
  },
]

export function findActivity(activityId) {
  return activities.find((activity) => activity.id === activityId) ?? activities[0]
}
