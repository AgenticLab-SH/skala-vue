<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { weatherCities } from '../data/weatherCities'
import { requestSunTimes, requestWeatherBundle } from '../services/weatherApi'
import { useConfigStore } from '../stores/configStore'
import { formatTemperature } from '../utils/temperature'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const status = ref('loading')
const bundle = ref(null)
const sunTimes = ref(null)
const sunTimesStatus = ref('loading')
const errorMessage = ref('')

const city = computed(() => weatherCities.find((item) => item.id === route.params.cityId))
const upcoming = computed(() => {
  if (!bundle.value) return []
  const now = Date.now()
  return bundle.value.forecast.filter((item) => new Date(item.time).getTime() >= now).slice(0, 8)
})

function displayTemperature(value) {
  return formatTemperature(value, configStore.unit, configStore.unitSymbol)
}

function displayPrecipitation(value) {
  return Number.isFinite(value) ? `${value}%` : '확인 불가'
}

function formatTime(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

async function loadDetail() {
  if (!city.value) return
  configStore.clearWeatherEffect()
  status.value = 'loading'
  bundle.value = null
  sunTimes.value = null
  sunTimesStatus.value = 'loading'
  errorMessage.value = ''
  configStore.rememberCity(city.value.id)
  const [weatherResult, sunResult] = await Promise.allSettled([
    requestWeatherBundle(city.value, { force: true }),
    requestSunTimes(city.value),
  ])
  if (weatherResult.status === 'rejected') {
    status.value = 'error'
    errorMessage.value = '날씨 데이터를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
    return
  }
  bundle.value = weatherResult.value
  configStore.setWeatherEffect(city.value.name, bundle.value.current)
  if (sunResult.status === 'fulfilled') {
    sunTimes.value = sunResult.value
    sunTimesStatus.value = 'success'
  } else {
    // 날씨는 정상인데 보조 API만 실패한 경우라 상세 화면 전체를 오류로 바꾸지는 않습니다.
    sunTimesStatus.value = 'error'
  }
  status.value = 'success'
}

function planFromCity() {
  configStore.savePlanner({ originId: city.value.id })
  router.push({ name: 'weather-home' })
}

watch(() => route.params.cityId, loadDetail)
onMounted(loadDetail)
</script>

<template>
  <div class="detail-view">
    <button class="back-button" type="button" @click="router.back()">← 이전 화면</button>
    <div v-if="status === 'loading'" class="state-panel">
      {{ city?.name }} 날씨를 불러오고 있습니다.
    </div>
    <div v-else-if="status === 'error'" class="state-panel">
      <strong>{{ errorMessage }}</strong>
      <button type="button" @click="loadDetail">다시 시도하기</button>
    </div>
    <template v-else-if="city && bundle">
      <header class="detail-header">
        <div>
          <p>{{ city.region }} · {{ bundle.source }}</p>
          <h1>{{ city.name }}</h1>
          <span>{{ city.place }}를 기준으로 확인했습니다.</span>
        </div>
        <div class="current-weather">
          <strong>{{ displayTemperature(bundle.current.temperature) }}</strong>
          <span>{{ bundle.current.condition }}</span>
          <button
            type="button"
            :aria-pressed="configStore.isFavorite(city.id)"
            @click="configStore.toggleFavorite(city.id)"
          >
            {{ configStore.isFavorite(city.id) ? '관심 도시 해제' : '관심 도시 저장' }}
          </button>
        </div>
      </header>

      <section class="metric-grid">
        <article>
          <span>강수 가능성</span
          ><strong>{{ displayPrecipitation(bundle.current.precipitationProbability) }}</strong>
        </article>
        <article>
          <span>습도</span><strong>{{ bundle.current.humidity }}%</strong>
        </article>
        <article>
          <span>풍속</span><strong>{{ bundle.current.windSpeed }}m/s</strong>
        </article>
        <article>
          <span>해가 떠 있는 시간</span>
          <strong v-if="sunTimesStatus === 'success'">
            {{ sunTimes.sunrise }}–{{ sunTimes.sunset }}
          </strong>
          <strong v-else-if="sunTimesStatus === 'error'">별도 API 확인 실패</strong>
          <strong v-else>확인 중</strong>
        </article>
      </section>

      <section class="forecast-section">
        <div class="section-heading">
          <p>다음 시간대</p>
          <span>이동 추천은 아래 예보 중 도착 시각과 가장 가까운 값을 사용합니다.</span>
        </div>
        <div class="forecast-list">
          <article v-for="item in upcoming" :key="item.time">
            <span>{{ formatTime(item.time) }}</span>
            <strong>{{ displayTemperature(item.temperature) }}</strong>
            <small>{{ item.condition }}</small>
            <small>비 {{ item.precipitationProbability }}%</small>
          </article>
        </div>
      </section>

      <section class="local-note">
        <p>이 지역에서 할 일</p>
        <div>
          <h2>{{ city.place }}</h2>
          <span>{{ city.activityNote }}</span>
        </div>
        <button type="button" @click="planFromCity">이 도시로 다시 계획하기 →</button>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-view {
  padding-top: 42px;
}
.back-button {
  padding: 0 0 4px;
  border: 0;
  border-bottom: 1px solid;
  background: transparent;
}
.state-panel {
  margin-top: 30px;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.state-panel button {
  display: block;
  margin-top: 14px;
}
.detail-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-top: 52px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--ink);
}
.detail-header p,
.detail-header h1,
.detail-header span {
  margin: 0;
}
.detail-header p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.detail-header h1 {
  margin: 10px 0;
  font-size: clamp(52px, 9vw, 92px);
  line-height: 1;
  letter-spacing: -0.07em;
}
.detail-header span {
  color: var(--muted);
}
.current-weather {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
}
.current-weather strong {
  font-size: clamp(38px, 7vw, 64px);
  line-height: 1;
}
.current-weather span {
  margin-top: 8px;
}
.current-weather button {
  min-height: 44px;
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
}
.metric-grid {
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.metric-grid article {
  padding: 24px 18px;
}
.metric-grid article + article {
  border-left: 1px solid var(--line);
}
.metric-grid span {
  display: block;
  color: var(--muted);
  font-size: 13px;
}
.metric-grid strong {
  display: block;
  margin-top: 10px;
  font-size: 20px;
}
.forecast-section {
  margin-top: 54px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}
.section-heading p {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}
.section-heading span {
  color: var(--muted);
  font-size: 13px;
}
.forecast-list {
  display: grid;
  grid-template-columns: repeat(8, minmax(115px, 1fr));
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.forecast-list article {
  min-width: 115px;
  padding: 20px 14px;
}
.forecast-list article + article {
  border-left: 1px solid var(--line);
}
.forecast-list span,
.forecast-list small {
  display: block;
  color: var(--muted);
  font-size: 12px;
}
.forecast-list strong {
  display: block;
  margin: 14px 0 8px;
  font-size: 24px;
}
.forecast-list small + small {
  margin-top: 5px;
}
.local-note {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 20px;
  align-items: center;
  margin-top: 54px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.local-note p,
.local-note h2 {
  margin: 0;
}
.local-note p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}
.local-note h2 {
  margin-bottom: 5px;
}
.local-note span {
  color: var(--muted);
}
.local-note button {
  min-height: 44px;
  padding: 0 0 4px;
  border: 0;
  border-bottom: 1px solid;
  background: transparent;
}
@media (max-width: 700px) {
  .detail-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .current-weather {
    align-items: flex-start;
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .metric-grid article:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .metric-grid article:nth-child(4) {
    border-top: 1px solid var(--line);
  }
  .section-heading,
  .local-note {
    align-items: flex-start;
    flex-direction: column;
    display: flex;
  }
}
</style>
