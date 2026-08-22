<template>
  <section class="page-section">
    <span>404</span>
    <h2>페이지를 찾지 못했습니다.</h2>
    <p>주소를 다시 확인하거나 이동 추천 화면에서 새 계획을 시작해 주세요.</p>
    <RouterLink to="/">이동 추천으로 돌아가기 →</RouterLink>
  </section>
</template>

<style scoped>
.page-section {
  margin-top: 64px;
  padding: 64px 0;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
}

h2,
p {
  margin-top: 0;
}

p {
  margin-bottom: 16px;
  color: var(--muted);
}

span {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

h2 {
  margin-top: 12px;
  font-size: clamp(34px, 6vw, 54px);
  letter-spacing: -0.05em;
}

a {
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}
</style>
