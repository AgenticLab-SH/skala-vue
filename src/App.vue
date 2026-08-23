<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

import UnitToggler from './components/weather/UnitToggler.vue'
import WeatherEffectsOverlay from './components/weather/WeatherEffectsOverlay.vue'
import WeatherEffectsToggle from './components/weather/WeatherEffectsToggle.vue'
import { useConfigStore } from './stores/configStore'

const route = useRoute()
const configStore = useConfigStore()
const weatherRoutes = new Set(['weather-home', 'weather-search', 'weather-detail'])

watch(
  () => route.name,
  (routeName) => {
    if (!weatherRoutes.has(routeName)) configStore.clearWeatherEffect()
  },
  { immediate: true },
)
</script>

<template>
  <div class="site-shell">
    <WeatherEffectsOverlay />
    <a class="skip-link" href="#main-content">본문으로 바로가기</a>
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="구름사이 홈">
        <span class="brand-mark" aria-hidden="true">◒</span>
        <span>구름사이</span>
      </RouterLink>

      <nav aria-label="주요 메뉴">
        <RouterLink to="/">이동 추천</RouterLink>
        <RouterLink to="/weather/search">도시 날씨</RouterLink>
        <RouterLink to="/process">구현 과정</RouterLink>
        <RouterLink to="/challenges">수업 실습 기록</RouterLink>
        <RouterLink to="/reference">레퍼런스</RouterLink>
      </nav>

      <div class="header-controls" aria-label="화면 설정">
        <WeatherEffectsToggle />
        <UnitToggler />
      </div>
    </header>

    <main id="main-content" class="page-container" tabindex="-1">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div>
        <strong>구름사이</strong>
      </div>
      <div class="footer-links">
        <span>예보와 이동 시간은 계획을 돕는 참고 정보입니다.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.site-shell {
  position: relative;
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
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}

.site-header {
  position: sticky;
  z-index: 10;
  top: 14px;
  display: grid;
  min-height: 64px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 7px 10px 7px 18px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 22px;
  background: var(--glass);
  box-shadow:
    0 12px 32px rgba(26, 37, 49, 0.1),
    inset 0 1px rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(155%);
  -webkit-backdrop-filter: blur(24px) saturate(155%);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 6px;
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
  justify-content: center;
  gap: 4px;
}

nav a,
.footer-links a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 14px;
  border-radius: 14px;
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
}

nav a.router-link-exact-active {
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(23, 32, 42, 0.06);
  color: var(--ink);
  font-weight: 800;
}

.site-header :deep(.el-button) {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.54);
  color: var(--muted);
}

.page-container {
  margin-top: 20px;
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

@supports not (backdrop-filter: blur(1px)) {
  .site-header {
    background: rgba(255, 255, 255, 0.97);
  }
}

@media (prefers-contrast: more) {
  .site-header {
    border-color: var(--line-strong);
    background: #fff;
    box-shadow: none;
  }
}

@media (max-width: 680px) {
  .site-header,
  .site-footer,
  .page-container {
    width: min(100% - 24px, 1180px);
  }

  .site-header {
    grid-template-columns: 1fr auto;
    gap: 6px 12px;
    padding: 9px;
    border-radius: 18px;
  }

  nav {
    grid-row: 2;
    grid-column: 1 / -1;
    justify-content: flex-start;
    overflow-x: auto;
    gap: 2px;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  nav::-webkit-scrollbar {
    display: none;
  }

  nav a {
    flex: 0 0 auto;
    padding: 0 12px;
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
