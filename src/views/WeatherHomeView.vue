<script setup>
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
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
const routeMap = ref(null)
const conditionSection = ref(null)
const resultSection = ref(null)
const routeSection = ref(null)
const timeSection = ref(null)
const activeJourneyStep = ref('conditions')
let routeSearchStartedAt = 0
let routeAnimationCompleteResolve
let routeAnimationFallbackTimer
let journeyScrollFrame
let revealedRouteKey = ''

const origin = computed(() => weatherCities.find((city) => city.id === originId.value))
const activity = computed(() => findActivity(activityId.value))
const hasRecommendation = computed(() => Boolean(planner.selectedRecommendation.value))
const selectedRouteKey = computed(() => {
  const recommendation = planner.selectedRecommendation.value
  if (!recommendation) return ''
  return `${recommendation.city.id}-${new Date(recommendation.arrivalAt).getTime()}`
})
const journeySteps = computed(() => [
  { id: 'conditions', number: '01', label: '출발 조건', available: true },
  {
    id: 'result',
    number: '02',
    label: '추천 결과',
    available: planner.status.value !== 'idle' && planner.status.value !== 'loading',
  },
  { id: 'route', number: '03', label: '이동 경로', available: hasRecommendation.value },
  { id: 'time', number: '04', label: '시간 변경', available: hasRecommendation.value },
])

function journeyElement(stepId) {
  return {
    conditions: conditionSection.value,
    result: resultSection.value,
    route: routeSection.value,
    time: timeSection.value,
  }[stepId]
}

function scrollToJourneyStep(stepId) {
  const step = journeySteps.value.find((item) => item.id === stepId)
  const element = journeyElement(stepId)
  if (!step?.available || !element) return
  activeJourneyStep.value = stepId
  element.scrollIntoView({
    block: 'start',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

function revealRouteWhenVisible() {
  if (!routeMap.value || !routeSection.value || !selectedRouteKey.value) return
  const bounds = routeSection.value.getBoundingClientRect()
  const routeIsVisible = bounds.top < window.innerHeight * 0.7 && bounds.bottom > 160
  if (!routeIsVisible || revealedRouteKey === selectedRouteKey.value) return
  revealedRouteKey = selectedRouteKey.value
  routeMap.value.playRouteReveal?.()
}

function updateJourneyStep() {
  const focusLine = Math.min(window.innerHeight * 0.42, 420)
  let currentStep = 'conditions'
  journeySteps.value.forEach((step) => {
    const element = journeyElement(step.id)
    if (step.available && element?.getBoundingClientRect().top <= focusLine) currentStep = step.id
  })
  activeJourneyStep.value = currentStep
  revealRouteWhenVisible()
}

function scheduleJourneyUpdate() {
  window.cancelAnimationFrame(journeyScrollFrame)
  journeyScrollFrame = window.requestAnimationFrame(updateJourneyStep)
}

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
    resultFeedback.value?.focus({ preventScroll: true })
    scrollToJourneyStep('result')
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
  resultFeedback.value?.focus({ preventScroll: true })
  scrollToJourneyStep('result')
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

watch(selectedRouteKey, () => {
  revealedRouteKey = ''
  nextTick(scheduleJourneyUpdate)
})

watch(routeMap, () => nextTick(scheduleJourneyUpdate))

onMounted(() => {
  document.documentElement.classList.add('planner-scroll-view')
  window.addEventListener('scroll', scheduleJourneyUpdate, { passive: true })
  window.addEventListener('resize', scheduleJourneyUpdate)
  loadWeatherGrid()
  // 첫 화면에서는 웰컴만 보여 주고, 지도 탐색은 사용자가 요청했을 때 시작합니다.
  submitPlanner(false, false)
  nextTick(scheduleJourneyUpdate)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('planner-scroll-view')
  window.removeEventListener('scroll', scheduleJourneyUpdate)
  window.removeEventListener('resize', scheduleJourneyUpdate)
  window.cancelAnimationFrame(journeyScrollFrame)
  window.clearTimeout(routeAnimationFallbackTimer)
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

    <nav class="journey-nav" aria-label="이동 추천 진행 단계">
      <button
        v-for="step in journeySteps"
        :key="step.id"
        type="button"
        :disabled="!step.available"
        :aria-current="activeJourneyStep === step.id ? 'step' : undefined"
        @click="scrollToJourneyStep(step.id)"
      >
        <span>{{ step.number }}</span>
        {{ step.label }}
      </button>
    </nav>

    <section
      id="journey-conditions"
      ref="conditionSection"
      class="journey-section conditions-stage"
    >
      <div class="hero-copy">
        <p class="journey-kicker">01 · 출발 조건</p>
        <h1>원하는 활동을<br />선택하세요.</h1>
        <div class="hero-description">
          <p>도착 예보를 점검해 날씨에 맞는 경로를 추천해드립니다.</p>
        </div>
      </div>

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
    </section>

    <section
      id="journey-result"
      ref="resultSection"
      class="journey-section result-section result-stage"
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
        <div ref="resultFeedback" class="journey-heading result-heading" tabindex="-1">
          <span>02</span>
          <div>
            <h2>추천 결과</h2>
            <p>도착 날씨와 이동 시간을 비교하고 원하는 후보를 선택할 수 있습니다.</p>
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
        <button class="section-continue" type="button" @click="scrollToJourneyStep('route')">
          이동 경로 보기 <span aria-hidden="true">↓</span>
        </button>
      </template>
    </section>

    <section
      v-if="planner.selectedRecommendation.value"
      id="journey-route"
      ref="routeSection"
      class="journey-section route-stage"
    >
      <div class="journey-heading">
        <span>03</span>
        <div>
          <h2>이동 경로</h2>
          <p>전체 위치에서 목적지 3D 건물까지 이어서 확인할 수 있습니다.</p>
        </div>
      </div>
      <Suspense>
        <RouteMap
          ref="routeMap"
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
      <button class="section-continue" type="button" @click="scrollToJourneyStep('time')">
        출발 시간 비교 <span aria-hidden="true">↓</span>
      </button>
    </section>

    <section
      v-if="planner.selectedRecommendation.value"
      id="journey-time"
      ref="timeSection"
      class="journey-section time-stage"
    >
      <div class="journey-heading">
        <span>04</span>
        <div>
          <h2>시간 변경</h2>
          <p>같은 장소를 기준으로 앞뒤 세 시간의 날씨를 다시 비교합니다.</p>
        </div>
      </div>
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
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: block;
}

:global(html.planner-scroll-view) {
  scroll-snap-type: y proximity;
}

.journey-nav {
  position: sticky;
  z-index: 8;
  top: 92px;
  display: grid;
  overflow: hidden;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 18px;
  background: rgba(248, 251, 253, 0.78);
  box-shadow: 0 10px 30px rgba(24, 40, 56, 0.08);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
}

.journey-nav button {
  display: flex;
  min-width: 0;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-right: 1px solid rgba(23, 32, 42, 0.08);
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 750;
}

.journey-nav button:last-child {
  border-right: 0;
}

.journey-nav button span {
  color: var(--accent);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.journey-nav button[aria-current='step'] {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 -2px var(--ink);
  color: var(--ink);
}

.journey-nav button:disabled {
  cursor: default;
  opacity: 0.38;
}

.journey-section {
  min-height: calc(100svh - 116px);
  padding: clamp(48px, 8vh, 88px) 0;
  scroll-margin-top: 152px;
  scroll-snap-align: start;
}

.conditions-stage {
  display: grid;
  align-content: center;
  gap: 34px;
}

.result-stage,
.route-stage,
.time-stage {
  display: grid;
  align-content: center;
}

.journey-kicker {
  margin: 0 0 14px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.journey-heading {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: start;
  gap: 14px;
  margin-bottom: 22px;
}

.journey-heading > span {
  padding-top: 5px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.journey-heading h2,
.journey-heading p {
  margin: 0;
}

.journey-heading h2 {
  font-size: 26px;
  letter-spacing: -0.045em;
}

.journey-heading p {
  margin-top: 7px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.section-continue {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-self: end;
  gap: 10px;
  padding: 0 4px;
  margin-top: 18px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: var(--ink);
  font-weight: 750;
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
  padding: 12px 0 0;
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

.plan-b {
  display: flex;
  gap: 16px;
  margin-bottom: 22px;
}

.plan-b h2 {
  margin: 0;
}

.plan-b h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
}

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

@supports not (backdrop-filter: blur(1px)) {
  .journey-nav {
    background: rgba(248, 251, 253, 0.98);
  }
}

@media (max-width: 1040px) {
  .journey-nav {
    top: 146px;
  }

  .journey-section {
    scroll-margin-top: 204px;
  }
}

@media (max-width: 760px) {
  .journey-nav button {
    min-height: 52px;
    flex-direction: column;
    gap: 2px;
    padding: 5px 3px;
    font-size: 11px;
  }

  .hero-copy {
    padding-top: 8px;
  }

  .journey-section {
    min-height: calc(100svh - 164px);
    padding: 42px 0;
    scroll-margin-top: 204px;
  }

  .result-overview {
    grid-template-columns: 1fr;
  }

  .candidate-list,
  .candidate-scroll {
    max-height: 440px;
  }

  .journey-heading {
    grid-template-columns: 28px 1fr;
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

@media (prefers-reduced-motion: reduce) {
  :global(html.planner-scroll-view) {
    scroll-snap-type: none;
  }
}
</style>
