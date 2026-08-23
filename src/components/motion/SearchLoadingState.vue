<script setup>
import { MAP_SEARCH_ANIMATION } from '../../assets/lottieAnimations'
import DotLottieCanvas from './DotLottieCanvas.vue'

defineProps({ message: { type: String, required: true } })
const emit = defineEmits(['ready'])
</script>

<template>
  <div class="search-loading" role="status">
    <div class="search-animation">
      <DotLottieCanvas
        :animation-data="MAP_SEARCH_ANIMATION"
        label="지도에서 목적지를 찾는 애니메이션"
        @ready="emit('ready')"
      />
    </div>
    <div>
      <strong>경로와 날씨를 확인하고 있습니다.</strong>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.search-loading {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(520px, 100%);
  min-height: 180px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 26px 30px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 28px;
  background: rgba(248, 251, 253, 0.72);
  box-shadow:
    0 28px 80px rgba(22, 43, 63, 0.18),
    inset 0 1px rgba(255, 255, 255, 0.96),
    inset 0 -1px rgba(95, 130, 162, 0.12);
  backdrop-filter: blur(28px) saturate(155%);
  -webkit-backdrop-filter: blur(28px) saturate(155%);
}

.search-loading::before {
  position: absolute;
  z-index: -1;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background: rgba(98, 168, 225, 0.18);
  content: '';
  filter: blur(18px);
  transform: translate3d(-160px, 75px, 0);
  animation: glass-current 2400ms ease-in-out infinite alternate;
}

.search-loading::after {
  position: absolute;
  z-index: -1;
  inset: 1px;
  border-radius: 27px;
  background: linear-gradient(125deg, rgba(255, 255, 255, 0.5), transparent 42%);
  content: '';
  pointer-events: none;
}

.search-animation {
  flex: 0 0 132px;
  width: 132px;
  height: 116px;
}

@keyframes glass-current {
  to {
    opacity: 0.62;
    transform: translate3d(170px, -70px, 0) scale(1.08);
  }
}

.search-loading strong,
.search-loading p {
  margin: 0;
}

.search-loading strong {
  font-size: 18px;
}

.search-loading p {
  margin-top: 7px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 520px) {
  .search-loading {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .search-animation {
    width: 116px;
    height: 98px;
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .search-loading {
    background: rgba(248, 251, 253, 0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-loading::before {
    animation: none;
    transform: translate3d(-70px, 40px, 0);
  }
}
</style>
