<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { WELCOME_ANIMATION } from '../../assets/lottieAnimations'
import DotLottieCanvas from './DotLottieCanvas.vue'

const isVisible = ref(true)
const welcomeOverlay = ref(null)
let closeTimer

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
    welcomeOverlay.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // 원본의 마지막 장면을 놓치지 않되, 재생 오류가 나면 오래 머물지 않도록 종료 시간을 제한합니다.
  closeTimer = window.setTimeout(closeWelcome, 2600)
  nextTick(() => welcomeOverlay.value?.focus())
})

onBeforeUnmount(() => {
  window.clearTimeout(closeTimer)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="welcome-fade" appear>
    <div
      v-if="isVisible"
      ref="welcomeOverlay"
      class="welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      tabindex="-1"
    >
      <section class="welcome-panel">
        <div class="welcome-animation">
          <DotLottieCanvas
            :animation-data="WELCOME_ANIMATION"
            label="환영 인사가 나타나는 애니메이션"
            :loop="false"
            :speed="5.2"
            @complete="closeWelcome"
          />
        </div>
        <h2 id="welcome-title">
          날씨의 요정이 당신이 하고 싶은 활동을 할 수 있는 경로를 안내해드립니다!
        </h2>
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

.welcome-panel h2 {
  margin: 0;
}

.welcome-panel h2 {
  max-width: 360px;
  font-size: 22px;
  line-height: 1.45;
  letter-spacing: -0.045em;
  word-break: keep-all;
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
