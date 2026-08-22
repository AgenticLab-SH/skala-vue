<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import CandidateCard from '../components/planner/CandidateCard.vue'
import DepartureComparison from '../components/planner/DepartureComparison.vue'
import PlannerForm from '../components/planner/PlannerForm.vue'
import RecommendationHero from '../components/planner/RecommendationHero.vue'
import { useTripPlanner } from '../composables/useTripPlanner'
import { findActivity } from '../data/activities'
import { weatherCities } from '../data/weatherCities'
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

const origin = computed(() => weatherCities.find((city) => city.id === originId.value))
const activity = computed(() => findActivity(activityId.value))
const resultFreshness = computed(() => {
  const bundle = planner.bestRecommendation.value?.bundle
  if (!bundle?.fetchedAt) return ''
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(bundle.fetchedAt))
  return `${time} ${bundle.cacheStatus === 'cached' ? '캐시 확인' : '갱신'}`
})

async function submitPlanner(focusResult = true) {
  configStore.savePlanner({
    originId: originId.value,
    activityId: activityId.value,
    maxTravelMinutes: maxTravelMinutes.value,
  })
  await planner.runPlanner({
    originId: originId.value,
    activityId: activityId.value,
    departureAt: new Date(departureAt.value),
    maxTravelMinutes: maxTravelMinutes.value,
  })
  if (focusResult) {
    await nextTick()
    resultFeedback.value?.focus()
  }
}

function openDetail(item) {
  router.push({
    name: 'weather-detail',
    params: { cityId: item.city.id },
    query: { from: originId.value, at: departureAt.value, activity: activityId.value },
  })
}

watch([originId, activityId, maxTravelMinutes], () => {
  configStore.savePlanner({
    originId: originId.value,
    activityId: activityId.value,
    maxTravelMinutes: maxTravelMinutes.value,
  })
})

onMounted(() => submitPlanner(false))
</script>

<template>
  <div class="home-view">
    <section class="hero-copy">
      <p class="eyebrow">날씨를 보고 움직이는 방법</p>
      <h1>도착할 때<br />맑은 곳을 찾습니다.</h1>
      <div class="hero-description">
        <p>출발 시각과 활동을 고르면 이동 가능한 도시의 도착 예보를 비교합니다.</p>
        <p class="data-note">최대 5일 예보 · 이동 시간 반영</p>
      </div>
    </section>

    <PlannerForm
      v-model:origin-id="originId"
      v-model:activity-id="activityId"
      v-model:departure-at="departureAt"
      v-model:max-travel-minutes="maxTravelMinutes"
      :loading="planner.status.value === 'loading'"
      :min-date="minDate"
      :max-date="maxDate"
      @submit="submitPlanner"
    />

    <section
      class="result-section"
      aria-live="polite"
      :aria-busy="planner.status.value === 'loading'"
    >
      <div v-if="planner.status.value === 'loading'" class="loading-panel" role="status">
        <p>도시별 도착 시각을 계산하고 예보를 비교하고 있습니다.</p>
      </div>

      <div
        v-else-if="planner.status.value === 'error'"
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

      <template v-else-if="planner.bestRecommendation.value">
        <div ref="resultFeedback" class="result-heading" tabindex="-1">
          <div>
            <h2>추천 목적지</h2>
            <span>
              {{ origin.name }} 출발 · {{ activity.label }} · {{ planner.dataSource.value }} 예보 ·
              {{ resultFreshness }}
            </span>
          </div>
        </div>

        <RecommendationHero
          :recommendation="planner.bestRecommendation.value"
          :origin-name="origin.name"
          :activity-id="activityId"
          @open-detail="openDetail(planner.bestRecommendation.value)"
        />

        <Suspense>
          <RouteMap
            :origin="origin"
            :destination="planner.bestRecommendation.value.city"
            :route="planner.bestRecommendation.value.route"
          />
          <template #fallback>
            <div class="loading-panel" role="status">경로 지도를 준비하고 있습니다.</div>
          </template>
        </Suspense>

        <div v-if="planner.recommendations.value.length > 1" class="candidate-list">
          <div class="candidate-heading">
            <h3>다른 선택지</h3>
            <span>점수는 강수 45%, 기온 25%, 바람 20%, 습도 10%를 반영합니다.</span>
          </div>
          <CandidateCard
            v-for="(item, index) in planner.recommendations.value.slice(1)"
            :key="item.city.id"
            :item="item"
            :rank="index + 2"
            @select="openDetail"
          />
        </div>

        <DepartureComparison :alternatives="planner.timeAlternatives.value" />

        <section v-if="planner.bestRecommendation.value.score < 55" class="plan-b">
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

.hero-copy {
  padding: 64px 0 18px;
}

.eyebrow {
  margin: 0 0 22px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
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
  display: flex;
  justify-content: space-between;
  gap: 32px;
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

.hero-description .data-note {
  max-width: none;
  font-size: 13px;
  white-space: nowrap;
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
  border-radius: 18px;
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

.candidate-list {
  margin: 32px 0;
}

.candidate-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 16px;
}

.candidate-heading h3 {
  margin: 0;
  font-size: 20px;
}

.candidate-heading span {
  color: var(--muted);
  font-size: 12px;
}

.plan-b {
  margin-top: 32px;
  padding: 26px;
  border: 1px solid var(--line);
  border-radius: 16px;
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

  .hero-description,
  .candidate-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-description .data-note {
    white-space: normal;
  }
}
</style>
