<script setup>
const apiUrl = import.meta.env.VITE_API_URL || '개발 서버에서 별도로 설정하지 않았습니다.'
const appMode = import.meta.env.VITE_APP_MODE || 'Development Mode'
const myRegion = `Suwon`
const regionGreeting = `웰컴 투 ${myRegion}`

console.log('현재 주입된 API 서버 주소:', apiUrl)
</script>

<template>
  <section class="practice-card">
    <h2>환경 변수와 빌드</h2>
    <p>현재 모드: {{ appMode }}</p>
    <p>API 주소: {{ apiUrl }}</p>
    <p>{{ regionGreeting }}</p>
  </section>
</template>

<style scoped>
p {
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}
</style>
