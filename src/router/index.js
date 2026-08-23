import { createRouter, createWebHashHistory } from 'vue-router'

import { weatherCities } from '../data/weatherCities'

function getAnchorTop(routeName) {
  const compactHeader = window.matchMedia('(max-width: 1040px)').matches
  if (routeName === 'challenge-archive') return compactHeader ? 218 : 176
  if (routeName === 'prompt-archive') return compactHeader ? 206 : 156
  return 108
}

const router = createRouter({
  // 정적 GitHub Pages에서도 새로고침 시 경로가 유지되도록 hash history를 사용합니다.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return { el: to.hash, top: getAnchorTop(to.name), behavior: reduceMotion ? 'auto' : 'smooth' }
    }
    return { top: 0 }
  },
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
      path: '/prompts',
      name: 'prompt-archive',
      component: () => import('../views/PromptArchiveView.vue'),
    },
    {
      path: '/reference',
      name: 'weather-reference',
      component: () => import('../views/ReferenceView.vue'),
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

export default router
