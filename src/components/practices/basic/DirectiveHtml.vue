<!-- eslint-disable vue/no-v-html -->
<script setup>
// 같은 문자열이 보간법과 v-html에서 어떻게 다르게 보이는지 비교합니다.
const rawHtmlData =
  '이 글자는 <span style="color: red; font-weight: bold;">빨간색 굵은 글자</span>입니다.'
</script>

<template>
  <section class="practice-section">
    <h2>v-html 디렉티브 학습</h2>
    <h3>일반 보간법 사용 결과:</h3>
    <p>{{ rawHtmlData }}</p>
    <br />
    <h3>v-html 디렉티브 사용 결과:</h3>
    <p v-html="rawHtmlData"></p>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}
</style>
