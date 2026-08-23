<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'

const configStore = useConfigStore()

const isVisible = computed(
  () => configStore.weatherEffectsEnabled && configStore.weatherEffect.mode !== 'none',
)
const effectClasses = computed(() => [
  `weather-overlay--${configStore.weatherEffect.mode}`,
  `weather-overlay--${configStore.weatherEffect.intensity}`,
])

// 위치와 속도를 고정해 다시 렌더링해도 빗방울이 갑자기 튀지 않도록 했습니다.
const rainDrops = Array.from({ length: 84 }, (_, index) => ({
  id: index,
  style: {
    '--drop-x': `${(index * 37 + 7) % 101}%`,
    '--drop-delay': `${-((index * 19) % 34) / 10}s`,
    '--drop-duration': `${0.72 + (index % 8) * 0.06}s`,
    '--drop-length': `${18 + (index % 6) * 5}px`,
    '--drop-opacity': `${0.28 + (index % 4) * 0.08}`,
  },
}))

const snowflakes = Array.from({ length: 32 }, (_, index) => ({
  id: index,
  style: {
    '--flake-x': `${(index * 43 + 11) % 101}%`,
    '--flake-delay': `${-((index * 23) % 70) / 10}s`,
    '--flake-duration': `${5.8 + (index % 7) * 0.65}s`,
    '--flake-size': `${3 + (index % 4) * 1.5}px`,
    '--flake-drift': `${-24 + (index % 6) * 10}px`,
  },
}))

const cloudBanks = Array.from({ length: 6 }, (_, index) => ({
  id: index,
  style: {
    '--cloud-top': `${4 + index * 14}%`,
    '--cloud-left': `${-28 + index * 19}%`,
    '--cloud-scale': `${0.86 + (index % 4) * 0.18}`,
    '--cloud-delay': `${-index * 7.5}s`,
    '--cloud-duration': `${38 + (index % 3) * 11}s`,
  },
}))
</script>

<template>
  <Transition name="weather-overlay-fade">
    <div v-if="isVisible" class="weather-overlay" :class="effectClasses" aria-hidden="true">
      <div class="weather-atmosphere"></div>

      <div v-if="configStore.weatherEffect.mode === 'sun'" class="sun-layer">
        <span class="sun-rays"></span>
        <span class="sun-disc"></span>
        <span class="sun-glow"></span>
      </div>

      <div
        v-if="['rain', 'cloud', 'snow'].includes(configStore.weatherEffect.mode)"
        class="cloud-layer"
      >
        <span
          v-for="cloud in cloudBanks"
          :key="cloud.id"
          class="cloud-bank"
          :style="cloud.style"
        ></span>
      </div>

      <div v-if="configStore.weatherEffect.mode === 'rain'" class="rain-layer">
        <span v-for="drop in rainDrops" :key="drop.id" class="rain-drop" :style="drop.style"></span>
      </div>

      <div v-else-if="configStore.weatherEffect.mode === 'snow'" class="snow-layer">
        <span
          v-for="flake in snowflakes"
          :key="flake.id"
          class="snowflake"
          :style="flake.style"
        ></span>
      </div>

      <div v-else-if="configStore.weatherEffect.mode === 'fog'" class="fog-layer">
        <span></span><span></span><span></span>
      </div>

      <div class="weather-overlay-caption">
        <span>출발지 {{ configStore.weatherEffect.cityName }}</span>
        <strong>{{ configStore.weatherEffect.condition }}</strong>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.weather-overlay {
  position: fixed;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.weather-atmosphere,
.cloud-layer,
.rain-layer,
.snow-layer,
.fog-layer,
.sun-layer {
  position: absolute;
  inset: 0;
}

.weather-atmosphere {
  background: linear-gradient(160deg, rgba(211, 229, 247, 0.6), rgba(238, 243, 247, 0.18));
}

.weather-overlay--sun .weather-atmosphere {
  background:
    radial-gradient(circle at 82% 12%, rgba(255, 207, 80, 0.64), transparent 30%),
    linear-gradient(155deg, rgba(206, 234, 255, 0.94), rgba(255, 244, 202, 0.78));
}

.weather-overlay--cloud .weather-atmosphere {
  background: linear-gradient(155deg, rgba(147, 168, 188, 0.62), rgba(220, 228, 235, 0.72));
}

.weather-overlay--rain .weather-atmosphere {
  background: linear-gradient(155deg, rgba(70, 98, 125, 0.67), rgba(185, 201, 216, 0.72));
}

.weather-overlay--snow .weather-atmosphere {
  background: linear-gradient(155deg, rgba(231, 242, 250, 0.92), rgba(248, 251, 253, 0.7));
}

.weather-overlay--heavy .weather-atmosphere {
  background: linear-gradient(160deg, rgba(56, 77, 99, 0.48), rgba(180, 195, 209, 0.42));
}

.sun-layer {
  overflow: hidden;
}

.sun-disc,
.sun-glow,
.sun-rays {
  position: absolute;
  top: 6vh;
  right: 8vw;
  border-radius: 50%;
}

.sun-disc {
  width: clamp(120px, 14vw, 210px);
  height: clamp(120px, 14vw, 210px);
  background: rgba(255, 197, 52, 0.94);
  box-shadow: 0 0 95px rgba(255, 188, 35, 0.68);
}

.sun-glow {
  width: clamp(310px, 38vw, 560px);
  height: clamp(310px, 38vw, 560px);
  margin: clamp(-180px, -12vw, -96px);
  border: 1px solid rgba(255, 207, 76, 0.32);
  background: radial-gradient(circle, rgba(255, 218, 112, 0.42), transparent 68%);
  animation: sun-breathe 8s ease-in-out infinite alternate;
}

.sun-rays {
  width: clamp(360px, 46vw, 680px);
  height: clamp(360px, 46vw, 680px);
  margin: clamp(-230px, -16vw, -120px);
  background: repeating-conic-gradient(
    from 8deg,
    rgba(255, 218, 119, 0.18) 0deg 7deg,
    transparent 7deg 22deg
  );
  filter: blur(3px);
  animation: sun-turn 48s linear infinite;
}

.cloud-layer {
  overflow: hidden;
  opacity: 0.92;
}

.cloud-bank {
  position: absolute;
  top: var(--cloud-top);
  left: var(--cloud-left);
  width: 380px;
  height: 92px;
  border-radius: 999px;
  background: rgba(159, 177, 194, 0.64);
  box-shadow:
    94px -38px 0 18px rgba(198, 208, 217, 0.64),
    198px -17px 0 8px rgba(142, 163, 181, 0.56),
    290px 5px 0 -2px rgba(128, 150, 170, 0.5),
    112px 26px 0 22px rgba(176, 192, 205, 0.58);
  filter: blur(10px);
  transform: translate3d(-8vw, 0, 0) scale(var(--cloud-scale));
  animation: cloud-drift var(--cloud-duration) linear var(--cloud-delay) infinite;
}

.weather-overlay--rain .cloud-layer {
  opacity: 0.68;
}

.rain-drop {
  position: absolute;
  top: -40px;
  left: var(--drop-x);
  width: 1.4px;
  height: var(--drop-length);
  border-radius: 999px;
  background: rgba(40, 100, 158, var(--drop-opacity));
  box-shadow: 0 0 3px rgba(72, 133, 188, 0.26);
  transform: rotate(12deg);
  animation: rain-fall var(--drop-duration) linear var(--drop-delay) infinite;
}

.weather-overlay--light .rain-drop:nth-child(2n) {
  display: none;
}

.weather-overlay--heavy .rain-drop {
  width: 1.5px;
  height: 32px;
  background: rgba(67, 111, 153, calc(var(--drop-opacity) + 0.08));
}

.snowflake {
  position: absolute;
  top: -20px;
  left: var(--flake-x);
  width: var(--flake-size);
  height: var(--flake-size);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 6px rgba(181, 205, 224, 0.42);
  animation: snow-fall var(--flake-duration) linear var(--flake-delay) infinite;
}

.weather-overlay--light .snowflake:nth-child(2n) {
  display: none;
}

.fog-layer {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  opacity: 0.42;
}

.fog-layer span {
  width: 115%;
  height: 16vh;
  border-radius: 50%;
  background: rgba(228, 234, 239, 0.76);
  filter: blur(24px);
  animation: fog-drift 24s ease-in-out infinite alternate;
}

.fog-layer span:nth-child(2) {
  margin-left: -15%;
  animation-delay: -8s;
}

.fog-layer span:nth-child(3) {
  animation-delay: -15s;
}

.weather-overlay-caption {
  position: absolute;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(18px, env(safe-area-inset-bottom));
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.84);
  box-shadow: 0 8px 28px rgba(29, 42, 54, 0.1);
  color: #354454;
  font-size: 12px;
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.weather-overlay-caption span::after {
  content: '·';
  margin-left: 8px;
  color: #83909c;
}

@keyframes cloud-drift {
  to {
    transform: translate3d(118vw, 0, 0) scale(var(--cloud-scale));
  }
}

@keyframes rain-fall {
  to {
    transform: translate3d(-12vw, 112vh, 0) rotate(12deg);
  }
}

@keyframes snow-fall {
  to {
    transform: translate3d(var(--flake-drift), 108vh, 0) rotate(260deg);
  }
}

@keyframes fog-drift {
  from {
    transform: translate3d(-5%, 0, 0) scale(1.05);
  }
  to {
    transform: translate3d(4%, 0, 0) scale(1.12);
  }
}

@keyframes sun-breathe {
  to {
    transform: scale(1.08);
    opacity: 0.76;
  }
}

@keyframes sun-turn {
  to {
    transform: rotate(360deg);
  }
}

.weather-overlay-fade-enter-active,
.weather-overlay-fade-leave-active {
  transition: opacity 260ms ease-out;
}

.weather-overlay-fade-enter-from,
.weather-overlay-fade-leave-to {
  opacity: 0;
}

@supports not (backdrop-filter: blur(1px)) {
  .weather-overlay-caption {
    background: rgba(248, 250, 252, 0.96);
  }
}

@media (max-width: 680px) {
  .weather-overlay-caption {
    right: max(12px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
  }

  .cloud-layer {
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rain-layer,
  .snow-layer {
    display: none;
  }

  .cloud-bank,
  .fog-layer span,
  .sun-rays,
  .sun-glow {
    animation: none;
  }

  .cloud-bank {
    transform: translate3d(8vw, 0, 0) scale(var(--cloud-scale));
  }
}

@media (prefers-contrast: more) {
  .weather-overlay {
    display: none;
  }
}
</style>
