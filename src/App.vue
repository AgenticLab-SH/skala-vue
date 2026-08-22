<script setup>
import UnitToggler from './components/weather/UnitToggler.vue'
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">본문으로 바로가기</a>
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="구름사이 홈">
        <span class="brand-mark" aria-hidden="true">◒</span>
        <span>구름사이</span>
      </RouterLink>

      <nav aria-label="주요 메뉴">
        <RouterLink to="/">이동 추천</RouterLink>
        <RouterLink to="/weather/search">도시 날씨</RouterLink>
        <RouterLink to="/about">만든 과정</RouterLink>
      </nav>

      <UnitToggler />
    </header>

    <main id="main-content" class="page-container" tabindex="-1">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div>
        <strong>구름사이</strong>
        <p>날씨를 피하는 대신, 더 나은 시간과 장소를 찾습니다.</p>
      </div>
      <div class="footer-links">
        <RouterLink to="/challenges">수업 실습 기록</RouterLink>
        <span>예보는 계획을 돕는 참고 정보입니다.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site-shell {
  min-height: 100vh;
}

.skip-link {
  position: fixed;
  z-index: 20;
  top: 8px;
  left: 8px;
  padding: 10px 14px;
  background: var(--ink);
  color: #fff;
  text-decoration: none;
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: translateY(0);
}

.site-header,
.site-footer,
.page-container {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

.site-header {
  display: grid;
  min-height: 74px;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  border-bottom: 1px solid var(--ink);
}

.brand {
  display: inline-flex;
  width: max-content;
  align-items: center;
  gap: 9px;
  color: var(--ink);
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
  letter-spacing: -0.04em;
}

.brand-mark {
  color: var(--accent);
  font-size: 20px;
}

nav {
  display: flex;
  gap: 28px;
}

nav a,
.footer-links a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: var(--ink);
  font-weight: 800;
}

.site-header :deep(.el-button) {
  justify-self: end;
  border: 0;
  background: transparent;
  color: var(--muted);
}

.page-container {
  padding-bottom: 90px;
}

.page-container:focus {
  outline: 0;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  padding: 34px 0 48px;
  border-top: 1px solid var(--ink);
}

.site-footer strong {
  font-size: 17px;
}

.site-footer p,
.footer-links span {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.footer-links {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

@media (max-width: 680px) {
  .site-header,
  .site-footer,
  .page-container {
    width: min(100% - 24px, 1160px);
  }

  .site-header {
    grid-template-columns: 1fr auto;
    padding: 16px 0;
  }

  nav {
    grid-row: 2;
    grid-column: 1 / -1;
    gap: 18px;
    margin-top: 16px;
  }

  .site-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .footer-links {
    align-items: flex-start;
  }
}
</style>
