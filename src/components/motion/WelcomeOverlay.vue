<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { WELCOME_ANIMATION } from '../../assets/lottieAnimations'
import DotLottieCanvas from './DotLottieCanvas.vue'

const isVisible = ref(false)
const startButton = ref(null)
let closeTimer
let reduceMotion = false

function scheduleClose(delay = reduceMotion ? 1200 : 3400) {
  window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(closeWelcome, delay)
}

async function closeWelcome() {
  if (!isVisible.value) return
  isVisible.value = false
  window.clearTimeout(closeTimer)
  document.removeEventListener('keydown', handleKeydown)
  await nextTick()
  document.querySelector('#main-content')?.focus({ preventScroll: true })
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeWelcome()
  if (event.key === 'Tab') {
    event.preventDefault()
    startButton.value?.focus()
  }
}

onMounted(() => {
  try {
    if (window.sessionStorage.getItem('weather-fairy-welcome-seen') === '1') return
    window.sessionStorage.setItem('weather-fairy-welcome-seen', '1')
  } catch {
    // 저장소를 막은 브라우저에서도 환영 화면 자체는 정상적으로 보여 줍니다.
  }
  isVisible.value = true
  document.addEventListener('keydown', handleKeydown)
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scheduleClose(reduceMotion ? 1200 : 7000)
  nextTick(() => startButton.value?.focus())
})

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="welcome-fade">
    <div
      v-if="isVisible"
      class="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <section class="welcome-panel">
        <div class="welcome-animation">
          <DotLottieCanvas
            :animation-data="WELCOME_ANIMATION"
            label="환영 인사가 나타나는 애니메이션"
            :loop="false"
            @ready="scheduleClose()"
          />
        </div>
        <div>
          <p>날씨의 요정</p>
          <h2 id="welcome-title">오늘 움직이기 좋은 곳을 찾아봅니다.</h2>
        </div>
        <button ref="startButton" type="button" @click="closeWelcome">바로 시작하기</button>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  z-index: 40;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgba(226, 236, 244, 0.92);
  backdrop-filter: blur(22px) saturate(130%);
  -webkit-backdrop-filter: blur(22px) saturate(130%);
}

.welcome-panel {
  display: grid;
  width: min(440px, 100%);
  justify-items: center;
  gap: 18px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 28px 80px rgba(24, 43, 62, 0.2);
  text-align: center;
}

.welcome-animation {
  width: min(260px, 72vw);
  height: 170px;
}

.welcome-panel p,
.welcome-panel h2 {
  margin: 0;
}

.welcome-panel p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.welcome-panel h2 {
  max-width: 330px;
  margin-top: 7px;
  font-size: 25px;
  line-height: 1.3;
  letter-spacing: -0.045em;
  word-break: keep-all;
}

.welcome-panel button {
  min-width: 160px;
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid var(--ink);
  border-radius: 14px;
  background: var(--ink);
  color: #fff;
  font-weight: 800;
}

.welcome-fade-enter-active,
.welcome-fade-leave-active {
  transition: opacity 220ms ease-out;
}

.welcome-fade-enter-active .welcome-panel,
.welcome-fade-leave-active .welcome-panel {
  transition:
    opacity 220ms ease-out,
    transform 260ms ease-out;
}

.welcome-fade-enter-from,
.welcome-fade-leave-to,
.welcome-fade-enter-from .welcome-panel,
.welcome-fade-leave-to .welcome-panel {
  opacity: 0;
}

.welcome-fade-enter-from .welcome-panel {
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 520px) {
  .welcome-panel {
    padding: 22px 18px;
  }

  .welcome-animation {
    height: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-fade-enter-active,
  .welcome-fade-leave-active,
  .welcome-fade-enter-active .welcome-panel,
  .welcome-fade-leave-active .welcome-panel {
    transition: none;
  }
}
</style>
