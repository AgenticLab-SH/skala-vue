<script setup>
const apiUrl = import.meta.env.VITE_API_URL || '개발 서버에서 별도로 설정하지 않았습니다.'
const appMode = import.meta.env.VITE_APP_MODE || 'Development Mode'
const viteMode = import.meta.env.MODE
const baseUrl = import.meta.env.BASE_URL
const myRegion = `Suwon`
const regionGreeting = `웰컴 투 ${myRegion}`

console.log('현재 주입된 API 서버 주소:', apiUrl)
</script>

<template>
  <div class="environment-grid">
    <section id="challenge-271" class="practice-card" tabindex="-1">
      <p class="page-label">271쪽 · Prettier</p>
      <h2>코드 형식 자동 정리</h2>
      <p><code>const myRegion = `Suwon`</code></p>
      <p>{{ regionGreeting }}</p>
    </section>

    <section id="challenge-272" class="practice-card" tabindex="-1">
      <p class="page-label">272쪽 · 환경 변수</p>
      <h2>실행 모드별 값</h2>
      <p>Vite 모드: {{ viteMode }}</p>
      <p>앱 모드: {{ appMode }}</p>
      <p>API 주소: {{ apiUrl }}</p>
    </section>

    <section id="challenge-273" class="practice-card" tabindex="-1">
      <p class="page-label">273쪽 · Build</p>
      <h2>배포 경로 확인</h2>
      <p>현재 BASE URL: {{ baseUrl }}</p>
      <p>Vite build 결과는 <code>dist/assets</code>에 생성됩니다.</p>
    </section>
  </div>
</template>

<style scoped>
.environment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.practice-card {
  scroll-margin-top: 108px;
}

.practice-card:focus {
  outline: 0;
}

p {
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}

.page-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
</style>
