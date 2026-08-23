<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'

import { activities } from '../../data/activities'
import { weatherCities } from '../../data/weatherCities'

defineProps({
  originId: { type: String, required: true },
  activityId: { type: String, required: true },
  departureAt: { type: String, required: true },
  maxTravelMinutes: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  minDate: { type: String, required: true },
  maxDate: { type: String, required: true },
})

const emit = defineEmits([
  'update:originId',
  'update:activityId',
  'update:departureAt',
  'update:maxTravelMinutes',
  'submit',
])

const activityFieldset = ref(null)
const submitButton = ref(null)
const departureInput = ref(null)
const maxTravelSelect = ref(null)
const guidanceStep = ref('')
const templateStatus = ref('')
let guidanceTimer

const quickTemplates = [
  {
    id: 'seoul-am',
    city: '서울',
    originId: 'seoul',
    hour: 10,
    maxTravelMinutes: 120,
    tone: 'morning',
  },
  {
    id: 'changwon-pm',
    city: '창원',
    originId: 'changwon',
    hour: 13,
    maxTravelMinutes: 180,
    tone: 'afternoon',
  },
  {
    id: 'gwangju-evening',
    city: '광주',
    originId: 'gwangju',
    hour: 19,
    maxTravelMinutes: 240,
    tone: 'evening',
  },
]

function tomorrowAt(hour) {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(hour, 0, 0, 0)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function guideTo(step, target) {
  window.clearTimeout(guidanceTimer)
  guidanceStep.value = step
  nextTick(() => {
    window.requestAnimationFrame(() => {
      target.value?.focus({ preventScroll: true })
      target.value?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      })
    })
  })
  guidanceTimer = window.setTimeout(() => {
    guidanceStep.value = ''
  }, 2200)
}

function applyQuickTemplate(template) {
  emit('update:originId', template.originId)
  emit('update:departureAt', tomorrowAt(template.hour))
  emit('update:maxTravelMinutes', template.maxTravelMinutes)
  templateStatus.value = `${template.city}에서 내일 ${String(template.hour).padStart(2, '0')}:00 출발, 최대 ${template.maxTravelMinutes / 60}시간을 적용했습니다. 활동을 선택해 주세요.`
  guideTo('activity', activityFieldset)
}

function selectActivity(activityId) {
  emit('update:activityId', activityId)
  templateStatus.value = '활동을 선택했습니다. 추천을 확인해 보세요.'
  guideTo('submit', submitButton)
}

function selectOrigin(originId) {
  emit('update:originId', originId)
  templateStatus.value = '출발 도시를 선택했습니다. 출발 시각을 정해 주세요.'
  guideTo('departure', departureInput)
}

function selectDeparture(departureAt) {
  emit('update:departureAt', departureAt)
  templateStatus.value = '출발 시각을 선택했습니다. 최대 이동 시간을 정해 주세요.'
  guideTo('travel', maxTravelSelect)
}

function selectMaxTravel(maxTravelMinutes) {
  emit('update:maxTravelMinutes', Number(maxTravelMinutes))
  templateStatus.value = '이동 시간을 선택했습니다. 하고 싶은 활동을 골라 주세요.'
  guideTo('activity', activityFieldset)
}

function submitPlanner() {
  window.clearTimeout(guidanceTimer)
  guidanceStep.value = ''
  emit('submit')
}

onBeforeUnmount(() => window.clearTimeout(guidanceTimer))
</script>

<template>
  <form class="planner-form" @submit.prevent="submitPlanner">
    <section class="quick-start" aria-labelledby="quick-start-title">
      <div>
        <h3 id="quick-start-title">사용 예시 템플릿으로 테스트해 보세요!</h3>
      </div>
      <div class="template-list">
        <button
          v-for="template in quickTemplates"
          :key="template.id"
          :class="`is-${template.tone}`"
          type="button"
          @click="applyQuickTemplate(template)"
        >
          <strong
            >{{ template.city }} · 내일 {{ String(template.hour).padStart(2, '0') }}:00</strong
          >
          <span>최대 {{ template.maxTravelMinutes / 60 }}시간 안에서 추천</span>
        </button>
      </div>
    </section>

    <div class="form-grid">
      <label>
        <span>출발 도시</span>
        <select :value="originId" @change="selectOrigin($event.target.value)">
          <option v-for="city in weatherCities" :key="city.id" :value="city.id">
            {{ city.name }}
          </option>
        </select>
      </label>

      <label :class="{ 'is-guided': guidanceStep === 'departure' }">
        <span>출발 시각</span>
        <input
          ref="departureInput"
          :value="departureAt"
          type="datetime-local"
          required
          :min="minDate"
          :max="maxDate"
          @change="selectDeparture($event.target.value)"
        />
      </label>

      <label :class="{ 'is-guided': guidanceStep === 'travel' }">
        <span>최대 이동 시간</span>
        <select
          ref="maxTravelSelect"
          :value="maxTravelMinutes"
          @change="selectMaxTravel($event.target.value)"
        >
          <option :value="30">30분</option>
          <option :value="60">1시간</option>
          <option :value="120">2시간</option>
          <option :value="180">3시간</option>
          <option :value="240">4시간</option>
          <option :value="300">5시간</option>
        </select>
      </label>
    </div>

    <fieldset
      ref="activityFieldset"
      class="activity-fieldset"
      :class="{ 'is-guided': guidanceStep === 'activity' }"
      tabindex="-1"
    >
      <legend>하고 싶은 활동</legend>
      <div class="activity-list">
        <label v-for="activity in activities" :key="activity.id" class="activity-option">
          <input
            type="radio"
            name="activity"
            :value="activity.id"
            :checked="activityId === activity.id"
            @change="selectActivity(activity.id)"
          />
          <span class="activity-mark" aria-hidden="true">{{ activity.icon }}</span>
          <span>{{ activity.label }}</span>
        </label>
      </div>
    </fieldset>

    <p class="template-status" aria-live="polite">{{ templateStatus }}</p>

    <button
      ref="submitButton"
      class="primary-action"
      :class="{ 'is-guided': guidanceStep === 'submit' }"
      type="submit"
      :disabled="loading"
    >
      {{ loading ? '예보를 비교하고 있습니다…' : '추천 확인하기' }}
    </button>
  </form>
</template>

<style scoped>
.planner-form {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-panel);
}

.quick-start {
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid color-mix(in srgb, var(--line) 80%, white);
  border-radius: 18px;
  background: rgba(248, 250, 253, 0.9);
  backdrop-filter: blur(16px) saturate(130%);
}

.quick-start h3,
.quick-start p {
  margin: 0;
}

.quick-start h3 {
  font-size: 15px;
}

.quick-start p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.template-list button {
  min-height: 62px;
  padding: 10px 12px;
  border: 1px solid var(--template-border);
  border-radius: 14px;
  background: var(--template-background);
  color: var(--ink);
  text-align: left;
  box-shadow: 0 8px 22px rgba(22, 34, 48, 0.07);
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.template-list button:hover {
  border-color: var(--template-accent);
  background: var(--template-hover);
}

.template-list button:active {
  transform: scale(0.98);
}

.template-list strong,
.template-list span {
  display: block;
}

.template-list strong {
  margin-top: 0;
  font-size: 14px;
}

.template-list span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.template-list .is-morning {
  --template-accent: #2466ad;
  --template-border: rgba(60, 123, 189, 0.35);
  --template-background: rgba(226, 240, 255, 0.88);
  --template-hover: rgba(237, 247, 255, 0.98);
}

.template-list .is-afternoon {
  --template-accent: #8b5b08;
  --template-border: rgba(194, 143, 48, 0.38);
  --template-background: rgba(255, 244, 209, 0.9);
  --template-hover: rgba(255, 249, 226, 0.98);
}

.template-list .is-evening {
  --template-accent: #6555a2;
  --template-border: rgba(112, 94, 169, 0.34);
  --template-background: rgba(237, 233, 252, 0.9);
  --template-hover: rgba(246, 243, 255, 0.98);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr 1fr;
  gap: 12px;
}

label span,
legend {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.form-grid label {
  padding: 5px;
  margin: -5px;
  border: 1px solid transparent;
  border-radius: 14px;
}

.form-grid label:focus-within {
  border-color: rgba(37, 99, 168, 0.38);
  box-shadow:
    0 0 0 4px rgba(37, 99, 168, 0.08),
    0 9px 26px rgba(31, 84, 145, 0.08);
}

select,
input[type='datetime-local'] {
  width: 100%;
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-control);
  background: #fff;
  color: var(--ink);
}

.activity-fieldset {
  padding: 8px;
  margin: 24px 0 0;
  border: 1px solid transparent;
  border-radius: 18px;
  outline: none;
}

.activity-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.activity-option {
  position: relative;
  display: flex;
  min-height: 64px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.activity-option:has(input:checked) {
  border-color: var(--ink);
  background: var(--soft);
}

.activity-option:has(input:focus-visible) {
  outline: 3px solid rgba(37, 99, 168, 0.25);
  outline-offset: 2px;
}

.activity-option input {
  position: absolute;
  opacity: 0;
}

.activity-option span {
  margin: 0;
}

.activity-mark {
  font-size: 22px;
  font-weight: 400;
}

.primary-action {
  width: 100%;
  min-height: 50px;
  margin-top: 24px;
  border: 1px solid var(--ink);
  border-radius: 14px;
  background: var(--ink);
  color: #fff;
  font-weight: 700;
  transition: transform 120ms ease;
}

.primary-action:active:not(:disabled) {
  transform: scale(0.99);
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.form-grid label.is-guided,
.activity-fieldset.is-guided,
.primary-action.is-guided {
  animation: next-action-pulse 900ms ease-in-out 2;
}

.template-status {
  min-height: 20px;
  margin: 12px 0 -12px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
}

@keyframes next-action-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 1px rgba(37, 99, 168, 0.18);
  }
  50% {
    border-color: rgba(61, 136, 225, 0.72);
    box-shadow:
      0 0 0 5px rgba(87, 156, 239, 0.14),
      0 16px 34px rgba(31, 84, 145, 0.13);
  }
}

@media (max-width: 760px) {
  .planner-form {
    padding: 22px 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .template-list {
    grid-template-columns: 1fr;
  }

  .activity-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .template-list button,
  .primary-action {
    transition: none;
  }

  .form-grid label.is-guided,
  .activity-fieldset.is-guided,
  .primary-action.is-guided {
    border-color: rgba(37, 99, 168, 0.72);
    animation: none;
    box-shadow: 0 0 0 4px rgba(37, 99, 168, 0.12);
  }
}
</style>
