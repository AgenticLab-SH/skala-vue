<!-- eslint-disable vue/no-v-html -->
<script setup>
// 태그가 문자로 보이는 경우와 실제 HTML로 적용되는 경우를 비교합니다.
const content = '안녕하세요! <strong>Skala-Vue</strong> 강의입니다.'
</script>

<template>
  <section class="practice-section">
    <h2>v-text 디렉티브 학습</h2>
    <h3>1) 일반 보간법 결과:</h3>
    <p>출력: {{ content }}</p>
    <br />
    <h3>2) v-text 디렉티브 결과:</h3>
    <p v-text="'출력: ' + content"></p>
    <br />
    <h3>3) v-html 결과 비교:</h3>
    <p v-html="content"></p>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}
</style>
