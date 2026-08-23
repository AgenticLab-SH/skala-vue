<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import CandidateCard from '../components/planner/CandidateCard.vue'
import DepartureComparison from '../components/planner/DepartureComparison.vue'
import PlannerForm from '../components/planner/PlannerForm.vue'
import RecommendationHero from '../components/planner/RecommendationHero.vue'
import SearchLoadingState from '../components/motion/SearchLoadingState.vue'
import { useTripPlanner } from '../composables/useTripPlanner'
import { findActivity } from '../data/activities'
import { weatherCities } from '../data/weatherCities'
import { requestKoreaWeatherGrid } from '../services/weatherApi'
import { useConfigStore } from '../stores/configStore'

const router = useRouter()
const configStore = useConfigStore()
const planner = useTripPlanner()
const RouteMap = defineAsyncComponent(() => import('../components/planner/RouteMap.vue'))

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function roundedDepartureDate() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 3)
  return date
}

const originId = ref(configStore.planner.originId)
const activityId = ref(configStore.planner.activityId)
const maxTravelMinutes = ref(configStore.planner.maxTravelMinutes)
const departureAt = ref(toLocalInputValue(roundedDepartureDate()))
const minDate = toLocalInputValue(new Date())
const maximumDate = new Date()
maximumDate.setDate(maximumDate.getDate() + 4)
const maxDate = toLocalInputValue(maximumDate)
const resultFeedback = ref(null)
const weatherGrid = ref([])
const weatherGridStatus = ref('loading')
const weatherGridError = ref('')
const routeSearchVisible = ref(false)
let routeSearchStartedAt = 0
let routeAnimationCompleteResolve
let routeAnimationFallbackTimer

const origin = computed(() => weatherCities.find((city) => city.id === originId.value))
const activity = computed(() => findActivity(activityId.value))

function showOriginWeatherEffect() {
  const originWeather = planner.recommendations.value.find(
    (item) => item.city.id === originId.value,
  )
  if (originWeather) configStore.setWeatherEffect(origin.value.name, originWeather.weather)
  else configStore.clearWeatherEffect()
}

async function submitPlanner(focusResult = true, showRouteSearch = true) {
  let animationComplete
  if (showRouteSearch) {
    window.clearTimeout(routeAnimationFallbackTimer)
    routeSearchStartedAt = performance.now()
    routeSearchVisible.value = true
    animationComplete = new Promise((resolve) => {
      routeAnimationCompleteResolve = resolve
      routeAnimationFallbackTimer = window.setTimeout(() => {
        resolve()
        routeAnimationCompleteResolve = null
      }, 2600)
    })
  }

  configStore.clearWeatherEffect()
  configStore.savePlanner({
    originId: originId.value,
    activityId: activityId.value,
    maxTravelMinutes: maxTravelMinutes.value,
  })
  const plannerRequest = planner.runPlanner({
    originId: originId.value,
    activityId: activityId.value,
    departureAt: new Date(departureAt.value),
    maxTravelMinutes: maxTravelMinutes.value,
  })
  if (showRouteSearch) {
    await Promise.all([plannerRequest, animationComplete])
    const remainingAnimationTime = 1000 - (performance.now() - routeSearchStartedAt)
    if (remainingAnimationTime > 0)
      await new Promise((resolve) => setTimeout(resolve, remainingAnimationTime))
    routeSearchVisible.value = false
  } else {
    await plannerRequest
  }
  showOriginWeatherEffect()
  if (focusResult) {
    await nextTick()
    resultFeedback.value?.focus()
  }
}

function handleRouteAnimationComplete() {
  if (!routeAnimationCompleteResolve) return
  window.clearTimeout(routeAnimationFallbackTimer)
  routeAnimationCompleteResolve()
  routeAnimationCompleteResolve = null
}

async function loadWeatherGrid(force = false) {
  weatherGridStatus.value = 'loading'
  weatherGridError.value = ''
  try {
    const result = await requestKoreaWeatherGrid({ force })
    weatherGrid.value = result.points
    weatherGridStatus.value = 'success'
  } catch {
    weatherGridStatus.value = 'error'
    weatherGridError.value = '현재 기상 지점 데이터를 불러오지 못했습니다.'
  }
}

function handleMapModeChange() {
  showOriginWeatherEffect()
}

async function selectCandidate(item) {
  planner.selectRecommendation(item.city.id)
  showOriginWeatherEffect()
  await nextTick()
  resultFeedback.value?.focus()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resultFeedback.value?.scrollIntoView({
    block: 'start',
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
}

function openDetail(item) {
  router.push({
    name: 'weather-detail',
    params: { cityId: item.city.id },
    query: { from: originId.value, at: departureAt.value, activity: activityId.value },
  })
}

async function applyDepartureAlternative(item) {
  departureAt.value = toLocalInputValue(new Date(item.departureAt))
  await submitPlanner()
}

watch([originId, activityId, maxTravelMinutes], ([nextOrigin], [previousOrigin]) => {
  configStore.savePlanner({
    originId: originId.value,
    activityId: activityId.value,
    maxTravelMinutes: maxTravelMinutes.value,
  })
  if (nextOrigin !== previousOrigin) configStore.clearWeatherEffect()
})

onMounted(() => {
  loadWeatherGrid()
  // 첫 화면에서는 웰컴만 보여 주고, 지도 탐색은 사용자가 요청했을 때 시작합니다.
  submitPlanner(false, false)
})
</script>

<template>
  <div class="home-view">
    <Teleport to="body">
      <Transition name="route-search-fade">
        <div v-if="routeSearchVisible" class="route-search-overlay">
          <SearchLoadingState
            message="도시별 도착 시각을 계산하고 예보를 비교합니다."
            @complete="handleRouteAnimationComplete"
          />
        </div>
      </Transition>
    </Teleport>

    <section class="hero-copy">
      <h1>원하는 활동을<br />선택하세요.</h1>
      <div class="hero-description">
        <p>도착 예보를 점검해 날씨에 맞는 경로를 추천해드립니다.</p>
      </div>
    </section>

    <PlannerForm
      v-model:origin-id="originId"
      v-model:activity-id="activityId"
      v-model:departure-at="departureAt"
      v-model:max-travel-minutes="maxTravelMinutes"
      :loading="planner.status.value === 'loading' || routeSearchVisible"
      :min-date="minDate"
      :max-date="maxDate"
      @submit="submitPlanner"
    />

    <section
      class="result-section"
      aria-live="polite"
      :aria-busy="planner.status.value === 'loading'"
    >
      <div
        v-if="planner.status.value === 'loading' && !planner.selectedRecommendation.value"
        class="initial-loading-space"
        aria-hidden="true"
      ></div>

      <div
        v-if="planner.status.value === 'error'"
        ref="resultFeedback"
        class="error-panel"
        tabindex="-1"
      >
        <strong>비교 결과를 만들지 못했습니다.</strong>
        <p>{{ planner.errorMessage.value }}</p>
        <button type="button" @click="submitPlanner">다시 시도하기</button>
      </div>

      <div
        v-else-if="planner.status.value === 'empty'"
        ref="resultFeedback"
        class="error-panel"
        tabindex="-1"
      >
        <strong>정한 시간 안에서 갈 수 있는 도시가 없습니다.</strong>
        <p>{{ planner.errorMessage.value }} 최대 이동 시간을 늘려 다시 비교해 보세요.</p>
      </div>

      <template v-else-if="planner.selectedRecommendation.value">
        <div ref="resultFeedback" class="result-heading" tabindex="-1">
          <div>
            <h2>추천 결과</h2>
          </div>
        </div>

        <div class="result-overview">
          <RecommendationHero
            :recommendation="planner.selectedRecommendation.value"
            :origin-name="origin.name"
            :activity-id="activityId"
            @open-detail="openDetail(planner.selectedRecommendation.value)"
          />

          <aside
            v-if="planner.recommendations.value.length"
            class="candidate-list"
            aria-labelledby="candidate-list-title"
          >
            <div class="candidate-heading">
              <div>
                <h3 id="candidate-list-title">이동 가능한 전체 후보</h3>
                <span>{{ planner.recommendations.value.length }}곳</span>
              </div>
              <small>눌러서 결과 변경</small>
            </div>
            <div class="candidate-scroll">
              <CandidateCard
                v-for="(item, index) in planner.recommendations.value"
                :key="item.city.id"
                :item="item"
                :rank="index + 1"
                :selected="item.city.id === planner.selectedRecommendation.value.city.id"
                compact
                @select="selectCandidate"
              />
            </div>
          </aside>
        </div>

        <Suspense>
          <RouteMap
            :origin="origin"
            :destination="planner.selectedRecommendation.value.city"
            :route-destination="planner.selectedRecommendation.value.routeDestination"
            :route="planner.selectedRecommendation.value.route"
            :arrival-at="planner.selectedRecommendation.value.arrivalAt"
            :weather-grid="weatherGrid"
            :weather-grid-status="weatherGridStatus"
            :weather-grid-error="weatherGridError"
            @mode-change="handleMapModeChange"
            @retry-weather-grid="loadWeatherGrid(true)"
          />
          <template #fallback>
            <div class="loading-panel" role="status">경로 지도를 준비하고 있습니다.</div>
          </template>
        </Suspense>

        <DepartureComparison
          :alternatives="planner.timeAlternatives.value"
          @select="applyDepartureAlternative"
        />

        <section v-if="planner.selectedRecommendation.value.score < 55" class="plan-b">
          <div>
            <h2>이동보다 계획을 바꾸는 편이 낫습니다.</h2>
            <span>{{ activity.planB }}</span>
          </div>
        </section>

        <p v-if="planner.failedCityCount.value" class="partial-notice">
          일부 도시 {{ planner.failedCityCount.value }}곳은 응답이 없어, 확인된 도시만 비교했습니다.
        </p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 56px;
}

.route-search-overlay {
  position: fixed;
  z-index: 35;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgba(208, 222, 234, 0.34);
  backdrop-filter: blur(14px) saturate(120%);
  -webkit-backdrop-filter: blur(14px) saturate(120%);
}

.initial-loading-space {
  min-height: 180px;
}

.route-search-fade-enter-active,
.route-search-fade-leave-active {
  transition: opacity 180ms ease-out;
}

.route-search-fade-enter-from,
.route-search-fade-leave-to {
  opacity: 0;
}

@supports not (backdrop-filter: blur(1px)) {
  .route-search-overlay {
    background: rgba(226, 235, 243, 0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-search-fade-enter-active,
  .route-search-fade-leave-active {
    transition: none;
  }
}

.hero-copy {
  padding: 64px 0 18px;
}

.hero-copy h1 {
  max-width: 850px;
  margin: 0;
  font-size: clamp(44px, 8vw, 84px);
  line-height: 1.02;
  letter-spacing: -0.07em;
  word-break: keep-all;
}

.hero-description {
  margin-top: 30px;
  padding-top: 22px;
  border-top: 1px solid var(--line-strong);
}

.hero-description p {
  max-width: 650px;
  margin: 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.75;
}

.result-section {
  min-height: 180px;
}

.result-heading,
.plan-b {
  display: flex;
  gap: 16px;
  margin-bottom: 22px;
}

.result-heading h2,
.result-heading span,
.plan-b h2 {
  margin: 0;
}

.result-heading h2,
.plan-b h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
}

.result-heading span,
.plan-b span {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 14px;
}

.loading-panel,
.error-panel {
  padding: 34px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
}

.error-panel p {
  margin: 0 0 16px;
}

.loading-panel p {
  margin: 0;
}

.error-panel button {
  min-height: 44px;
  border: 0;
  border-bottom: 1px solid;
  background: transparent;
  padding: 0 0 3px;
}

.result-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: stretch;
  gap: 16px;
}

.candidate-list {
  overflow: hidden;
  min-width: 0;
  max-height: 560px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-panel);
  background: var(--surface);
}

.candidate-heading {
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
}

.candidate-heading h3 {
  margin: 0;
  font-size: 15px;
}

.candidate-heading span,
.candidate-heading small {
  color: var(--muted);
  font-size: 11px;
}

.candidate-heading span {
  display: block;
  margin-top: 3px;
}

.candidate-scroll {
  overflow-y: auto;
  max-height: 489px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.plan-b {
  margin-top: 32px;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.partial-notice {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.result-heading:focus,
.error-panel:focus {
  outline: 0;
}

@media (max-width: 760px) {
  .home-view {
    gap: 38px;
  }

  .hero-copy {
    padding-top: 38px;
  }

  .result-overview {
    grid-template-columns: 1fr;
  }

  .candidate-list,
  .candidate-scroll {
    max-height: 440px;
  }
}

@media (min-width: 761px) and (max-width: 1080px) {
  .result-overview {
    grid-template-columns: 1fr;
  }

  .candidate-list,
  .candidate-scroll {
    max-height: 420px;
  }
}
</style>
