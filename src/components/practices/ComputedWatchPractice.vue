<script setup>
import { computed, reactive, ref, watch, watchEffect } from 'vue'

const firstName = ref('스칼라')
const lastName = ref('김')
const searchQuery = ref('')
const selectedCategory = ref('전체')
const logs = ref([])
const profile = reactive({
  name: '김스칼라',
  address: { city: '광주', detail: '광산구' },
})
const reactiveCounter = reactive({ count: 0 })

const fullName = computed(() => `${lastName.value}${firstName.value}`)
const filteredLogCount = computed(
  () => logs.value.filter((log) => log.includes(searchQuery.value)).length,
)

function addLog(message) {
  logs.value.unshift(`${new Date().toLocaleTimeString('ko-KR')} ${message}`)
  logs.value = logs.value.slice(0, 8)
}

watch(firstName, (next, previous) => addLog(`이름: ${previous} → ${next}`))
watch([searchQuery, selectedCategory], ([query, category]) =>
  addLog(`검색: ${query || '없음'} / ${category}`),
)
watch(profile, () => addLog(`deep 감시: ${profile.address.city} ${profile.address.detail}`), {
  deep: true,
})
watch(
  () => reactiveCounter.count,
  (count) => addLog(`reactive count: ${count}`),
)
watchEffect(() => {
  // 의존성을 따로 적지 않아도 내부에서 사용한 searchQuery를 추적합니다.
  console.log(`[watchEffect] 현재 검색어: ${searchQuery.value}`)
})
</script>

<template>
  <div class="practice-grid">
    <article class="practice-card">
      <h2>computed</h2>
      <div class="control-row">
        <input v-model.trim="lastName" aria-label="성" />
        <input v-model.trim="firstName" aria-label="이름" />
      </div>
      <p class="result">전체 이름: {{ fullName }}</p>
      <p class="muted">관련 값이 바뀔 때만 계산 결과를 다시 만듭니다.</p>
    </article>

    <article class="practice-card">
      <h2>watch와 다중 소스</h2>
      <div class="control-row">
        <input v-model="searchQuery" placeholder="로그 검색" />
        <select v-model="selectedCategory">
          <option>전체</option>
          <option>Vue</option>
          <option>JavaScript</option>
        </select>
      </div>
      <p class="result">일치 로그: {{ filteredLogCount }}개</p>
    </article>

    <article class="practice-card">
      <h2>deep 및 reactive 감시</h2>
      <div class="control-row">
        <input v-model="profile.address.city" aria-label="도시" />
        <input v-model="profile.address.detail" aria-label="상세 주소" />
        <button type="button" @click="reactiveCounter.count++">reactive 증가</button>
      </div>
      <p class="result">
        {{ profile.address.city }} {{ profile.address.detail }} / {{ reactiveCounter.count }}
      </p>
    </article>

    <article class="practice-card log-card">
      <h2>변경 기록</h2>
      <p v-if="logs.length === 0" class="muted">입력값을 바꾸면 watch 결과가 여기에 쌓입니다.</p>
      <ul v-else>
        <li v-for="log in logs" :key="log">{{ log }}</li>
      </ul>
    </article>
  </div>
</template>

<style scoped>
.log-card {
  grid-column: 1 / -1;
}

.log-card li {
  margin-bottom: 0.4rem;
}
</style>
