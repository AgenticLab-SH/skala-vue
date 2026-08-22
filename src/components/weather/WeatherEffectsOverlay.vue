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
const rainDrops = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  style: {
    '--drop-x': `${(index * 37 + 7) % 101}%`,
    '--drop-delay': `${-((index * 19) % 34) / 10}s`,
    '--drop-duration': `${0.68 + (index % 8) * 0.055}s`,
    '--drop-length': `${14 + (index % 5) * 4}px`,
    '--drop-opacity': `${0.2 + (index % 4) * 0.07}`,
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

const cloudBanks = Array.from({ length: 4 }, (_, index) => ({
  id: index,
  style: {
    '--cloud-top': `${8 + index * 15}%`,
    '--cloud-left': `${-18 + index * 27}%`,
    '--cloud-scale': `${0.78 + index * 0.13}`,
    '--cloud-delay': `${-index * 5.5}s`,
    '--cloud-duration': `${32 + index * 8}s`,
  },
}))
</script>

<template>
  <Transition name="weather-overlay-fade">
    <div v-if="isVisible" class="weather-overlay" :class="effectClasses" aria-hidden="true">
      <div class="weather-atmosphere"></div>

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
        <span>{{ configStore.weatherEffect.cityName }}</span>
        <strong>{{ configStore.weatherEffect.condition }}</strong>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.weather-overlay {
  position: fixed;
  z-index: 5;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.weather-atmosphere,
.cloud-layer,
.rain-layer,
.snow-layer,
.fog-layer {
  position: absolute;
  inset: 0;
}

.weather-atmosphere {
  background: rgba(61, 78, 96, 0.055);
}

.weather-overlay--rain .weather-atmosphere {
  background: rgba(42, 60, 78, 0.085);
}

.weather-overlay--snow .weather-atmosphere {
  background: rgba(221, 235, 245, 0.1);
}

.weather-overlay--heavy .weather-atmosphere {
  background: rgba(35, 51, 69, 0.12);
}

.cloud-layer {
  overflow: hidden;
  opacity: 0.68;
}

.cloud-bank {
  position: absolute;
  top: var(--cloud-top);
  left: var(--cloud-left);
  width: 310px;
  height: 74px;
  border-radius: 999px;
  background: rgba(174, 188, 201, 0.34);
  box-shadow:
    78px -31px 0 13px rgba(190, 202, 212, 0.4),
    165px -13px 0 5px rgba(154, 171, 187, 0.32),
    236px 4px 0 -3px rgba(141, 160, 178, 0.28),
    92px 20px 0 18px rgba(183, 196, 207, 0.36);
  filter: blur(17px);
  transform: translate3d(-8vw, 0, 0) scale(var(--cloud-scale));
  animation: cloud-drift var(--cloud-duration) linear var(--cloud-delay) infinite;
}

.weather-overlay--rain .cloud-layer {
  opacity: 0.46;
}

.rain-drop {
  position: absolute;
  top: -40px;
  left: var(--drop-x);
  width: 1px;
  height: var(--drop-length);
  border-radius: 999px;
  background: rgba(86, 132, 174, var(--drop-opacity));
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
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.7);
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
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rain-layer,
  .snow-layer {
    display: none;
  }

  .cloud-bank,
  .fog-layer span {
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
