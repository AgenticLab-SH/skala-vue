<script setup>
import { reactive, ref } from 'vue'

const count = ref(0)
const message = ref('ref는 숫자처럼 단순한 값도 반응형으로 관리합니다.')
const learner = reactive({
  name: '김스칼라',
  progress: 30,
  skills: ['HTML', 'JavaScript'],
})

function study() {
  learner.progress = Math.min(100, learner.progress + 10)
  if (learner.progress >= 60 && !learner.skills.includes('Vue')) learner.skills.push('Vue')
}
</script>

<template>
  <div class="practice-grid">
    <article class="practice-card">
      <h2>ref</h2>
      <p>{{ message }}</p>
      <div class="control-row">
        <button type="button" @click="count++">카운트 올리기</button>
        <button type="button" class="secondary" @click="message = '화면이 바로 갱신되었습니다.'">
          문구 변경
        </button>
      </div>
      <p class="result">현재 카운트: {{ count }}</p>
    </article>

    <article class="practice-card">
      <h2>reactive 객체</h2>
      <p>{{ learner.name }}의 학습률: {{ learner.progress }}%</p>
      <progress :value="learner.progress" max="100"></progress>
      <p>학습한 기술: {{ learner.skills.join(', ') }}</p>
      <button type="button" @click="study">10% 학습하기</button>
    </article>
  </div>
</template>

<style scoped>
progress {
  width: 100%;
  height: 18px;
}
</style>
