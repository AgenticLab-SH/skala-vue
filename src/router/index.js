import { createRouter, createWebHashHistory } from 'vue-router'

import { weatherCities } from '../data/weatherCities'

const router = createRouter({
  // 정적 GitHub Pages에서도 새로고침 시 경로가 유지되도록 hash history를 사용합니다.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'weather-home',
      component: () => import('../views/WeatherHomeView.vue'),
    },
    {
      path: '/weather/search',
      name: 'weather-search',
      component: () => import('../views/WeatherSearchView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('../views/WeatherDetailView.vue'),
    },
    {
      path: '/challenges',
      name: 'challenge-archive',
      component: () => import('../views/ChallengeArchiveView.vue'),
    },
    {
      path: '/process',
      name: 'weather-process',
      component: () => import('../views/WeatherAboutView.vue'),
    },
    {
      path: '/about',
      redirect: '/process',
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  // 동적 경로의 도시 코드를 목업 목록과 한 번 더 대조합니다.
  if (to.name === 'weather-detail' && !weatherCities.some((city) => city.id === to.params.cityId)) {
    next({ path: '/not-found' })
    return
  }

  next()
})

router.afterEach(() => {
  window.scrollTo({ top: 0, behavior: 'auto' })
})

export default router
