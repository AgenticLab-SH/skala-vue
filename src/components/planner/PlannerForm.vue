<script setup>
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
</script>

<template>
  <form class="planner-form" @submit.prevent="emit('submit')">
    <div class="form-heading">
      <div>
        <h2>어떤 날을 보내고 싶나요?</h2>
        <p>출발 조건을 정하면 예보와 이동 시간을 함께 비교합니다.</p>
      </div>
    </div>

    <div class="form-grid">
      <label>
        <span>출발 도시</span>
        <select :value="originId" @change="emit('update:originId', $event.target.value)">
          <option v-for="city in weatherCities" :key="city.id" :value="city.id">
            {{ city.name }}
          </option>
        </select>
      </label>

      <label>
        <span>출발 시각</span>
        <input
          :value="departureAt"
          type="datetime-local"
          required
          :min="minDate"
          :max="maxDate"
          @input="emit('update:departureAt', $event.target.value)"
        />
      </label>

      <label>
        <span>최대 이동 시간</span>
        <select
          :value="maxTravelMinutes"
          @change="emit('update:maxTravelMinutes', Number($event.target.value))"
        >
          <option :value="120">2시간</option>
          <option :value="180">3시간</option>
          <option :value="240">4시간</option>
          <option :value="360">6시간</option>
        </select>
      </label>
    </div>

    <fieldset>
      <legend>하고 싶은 활동</legend>
      <div class="activity-list">
        <label v-for="activity in activities" :key="activity.id" class="activity-option">
          <input
            type="radio"
            name="activity"
            :value="activity.id"
            :checked="activityId === activity.id"
            @change="emit('update:activityId', activity.id)"
          />
          <span class="activity-mark" aria-hidden="true">{{ activity.icon }}</span>
          <span>{{ activity.label }}</span>
        </label>
      </div>
    </fieldset>

    <button class="primary-action" type="submit" :disabled="loading">
      {{ loading ? '날씨를 비교하고 있습니다…' : '맑은 쪽 찾아보기' }}
    </button>
  </form>
</template>

<style scoped>
.planner-form {
  padding: 32px;
  border: 1px solid var(--line);
  background: var(--surface);
}

.form-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 28px;
}

.form-heading h2,
.form-heading p {
  margin: 0;
}

.form-heading h2 {
  font-size: 22px;
  letter-spacing: -0.04em;
}

.form-heading p {
  margin-top: 6px;
  color: var(--muted);
  font-size: 14px;
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

select,
input[type='datetime-local'] {
  width: 100%;
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 0;
  background: #fff;
  color: var(--ink);
}

fieldset {
  padding: 0;
  margin: 24px 0 0;
  border: 0;
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

@media (max-width: 760px) {
  .planner-form {
    padding: 22px 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .activity-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
