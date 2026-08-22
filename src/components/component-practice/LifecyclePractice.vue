<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from 'vue'

const emit = defineEmits(['lifecycle-event'])

const elapsedSeconds = ref(0)
const lastUpdatedAt = ref('아직 변경 전입니다.')
let timerId

function report(stage, message) {
  emit('lifecycle-event', { stage, message })
}

onMounted(() => {
  report('mounted', '컴포넌트가 생성되어 3초 타이머를 시작했습니다.')
  timerId = window.setInterval(() => {
    elapsedSeconds.value += 3
  }, 3000)
})

onUpdated(() => {
  lastUpdatedAt.value = `${elapsedSeconds.value}초 경과 후 updated가 실행되었습니다.`
  report('updated', lastUpdatedAt.value)
})

onUnmounted(() => {
  window.clearInterval(timerId)
  report('unmounted', '컴포넌트가 소멸되어 타이머를 정리했습니다.')
})
</script>

<template>
  <section class="exercise-section" aria-labelledby="lifecycle-title">
    <h2 id="lifecycle-title">라이프사이클 훅 확인</h2>

    <div class="timer-result" aria-live="polite">
      <strong>현재 경과 시간: {{ elapsedSeconds }}초</strong>
      <p>{{ lastUpdatedAt }}</p>
    </div>
  </section>
</template>

<style scoped>
.exercise-section {
  padding: 18px;
  border: 1px solid #bbb;
}

h2,
p {
  margin: 0;
}

h2 {
  margin-bottom: 10px;
  font-size: 22px;
}

.timer-result {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #bbb;
}

.timer-result p {
  margin-top: 8px;
}
</style>
