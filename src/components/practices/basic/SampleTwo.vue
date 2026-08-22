<script setup>
// 영문 문자열을 사용해야 대문자 변환 결과가 잘 보여서 교재 문구를 유지했습니다.
const welcomeMessage = 'Welcome to Skala-Vue'
</script>

<template>
  <section class="practice-section">
    <h2>텍스트 보간과 JavaScript 표현식</h2>
    <h3>원문</h3>
    <p>{{ welcomeMessage }}</p>
    <h3>대문자 변환</h3>
    <p>{{ welcomeMessage.toUpperCase() }}</p>
    <h3>난수 표현식</h3>
    <p>{{ '무작위 숫자: ' + Math.ceil(Math.random() * 100) }}</p>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}
</style>
