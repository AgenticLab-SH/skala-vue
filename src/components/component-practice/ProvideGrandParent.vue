<script setup>
import { computed, provide, ref } from 'vue'

import ProvideMiddle from './ProvideMiddle.vue'

const studyMode = ref('집중 모드')
const guideText = computed(() =>
  studyMode.value === '집중 모드'
    ? '알림을 줄이고 실습 코드에 집중합니다.'
    : '잠깐 쉬면서 다음 예제를 정리합니다.',
)

function toggleStudyMode() {
  studyMode.value = studyMode.value === '집중 모드' ? '휴식 모드' : '집중 모드'
}

provide('studyMode', studyMode)
provide('guideText', guideText)
provide('toggleStudyMode', toggleStudyMode)
</script>

<template>
  <section class="provide-section" aria-labelledby="provide-title">
    <h2 id="provide-title">중간 컴포넌트를 거치지 않고 값 전달하기</h2>
    <p class="mode-result"><strong>현재 학습 상태:</strong> {{ studyMode }}</p>
    <ProvideMiddle />
  </section>
</template>

<style scoped>
.provide-section {
  margin-top: 16px;
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

.mode-result {
  margin-top: 12px;
}
</style>
