<script setup>
import { ref } from 'vue'

const clickCount = ref(0)
const lastEvent = ref('아직 이벤트가 없습니다.')
const submittedKeyword = ref('')
const keyword = ref('')

function inspectEvent(event) {
  lastEvent.value = `${event.type} / ${event.target.tagName} / x좌표 ${event.clientX}`
}

function submitSearch() {
  submittedKeyword.value = keyword.value.trim() || '검색어 없음'
}
</script>

<template>
  <div class="practice-grid">
    <article class="practice-card">
      <h2>이벤트 핸들러</h2>
      <div class="control-row">
        <button type="button" @click="clickCount++">인라인 핸들러</button>
        <button type="button" class="secondary" @click="clickCount = 0">초기화</button>
      </div>
      <p class="result">클릭 횟수: {{ clickCount }}</p>
    </article>

    <article class="practice-card event-area" @click="inspectEvent">
      <h2>이벤트 객체</h2>
      <p>이 카드 안을 클릭하면 event 객체의 값을 확인합니다.</p>
      <p class="result">{{ lastEvent }}</p>
    </article>

    <article class="practice-card">
      <h2>이벤트 수식어</h2>
      <form class="control-row" @submit.prevent="submitSearch">
        <input v-model="keyword" placeholder="검색어 입력" @keyup.enter.exact="submitSearch" />
        <button type="submit">검색</button>
      </form>
      <div class="outer" @click="lastEvent = '바깥 영역 클릭'">
        바깥 영역
        <button type="button" @click.stop="lastEvent = '.stop 버튼만 클릭'">전파 막기</button>
      </div>
      <p class="result">제출 결과: {{ submittedKeyword || '대기 중' }}</p>
      <p class="muted">{{ lastEvent }}</p>
    </article>
  </div>
</template>

<style scoped>
.event-area {
  cursor: crosshair;
}

.outer {
  margin-top: 0.9rem;
  padding: 1rem;
  border: 1px dashed;
}

.outer button {
  margin-left: 0.6rem;
}
</style>
