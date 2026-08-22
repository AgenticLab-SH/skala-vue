<script setup>
import { ref } from 'vue'

const score = ref(82)
const isVisible = ref(true)
const selectedUser = ref(1)
const renderCount = ref(0)
const users = [
  { id: 1, name: '김스칼라', role: '프론트엔드' },
  { id: 2, name: '이뷰', role: '백엔드' },
  { id: 3, name: '박자바', role: '기획' },
]
const profile = { name: '김스칼라', class: '광주 1반', subject: 'Vue.js' }
</script>

<template>
  <div class="practice-grid">
    <article class="practice-card">
      <h2>조건부 렌더링</h2>
      <div class="control-row">
        <label>점수 <input v-model.number="score" type="number" min="0" max="100" /></label>
        <button type="button" class="secondary" @click="isVisible = !isVisible">v-show 전환</button>
      </div>
      <p v-if="score >= 90" class="result">A 등급입니다.</p>
      <p v-else-if="score >= 80" class="result">B 등급입니다.</p>
      <p v-else class="result">조금 더 연습해 보겠습니다.</p>
      <p v-show="isVisible" class="result">이 문장은 DOM에 남아 있고 display만 바뀝니다.</p>
    </article>

    <article class="practice-card">
      <h2>목록과 객체 순회</h2>
      <ul>
        <li v-for="(user, index) in users" :key="user.id">
          {{ index + 1 }}. {{ user.name }} / {{ user.role }}
        </li>
      </ul>
      <dl>
        <template v-for="(value, key) in profile" :key="key">
          <dt>{{ key }}</dt>
          <dd>{{ value }}</dd>
        </template>
      </dl>
    </article>

    <article class="practice-card">
      <h2>렌더링 제어 디렉티브</h2>
      <p v-pre class="result">v-pre 결과: {{ 이 부분은 컴파일하지 않음 }}</p>
      <p v-cloak class="result">v-cloak은 앱이 마운트되기 전 콧수염 문법이 보이는 것을 막습니다.</p>
      <p v-once class="result">v-once 최초 값: {{ score }}</p>
      <div class="control-row">
        <button type="button" @click="renderCount++">전체 상태 변경 {{ renderCount }}</button>
        <button type="button" class="secondary" @click="selectedUser = (selectedUser % 3) + 1">
          선택 사용자 변경
        </button>
      </div>
      <p v-memo="[selectedUser]" class="result">
        v-memo 영역: 사용자 {{ selectedUser }}, 전체 변경 {{ renderCount }}
      </p>
      <p class="muted">
        선택 사용자가 같으면 전체 상태가 바뀌어도 v-memo 영역은 갱신하지 않습니다.
      </p>
    </article>
  </div>
</template>

<style scoped>
input {
  width: 90px;
}

dl {
  display: grid;
  grid-template-columns: 90px 1fr;
  margin-bottom: 0;
}

dt {
  font-weight: 700;
}

dd {
  margin: 0 0 0.5rem;
}

[v-cloak] {
  display: none;
}
</style>
