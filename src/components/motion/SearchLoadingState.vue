<script setup>
import { MAP_SEARCH_ANIMATION } from '../../assets/lottieAnimations'
import DotLottieCanvas from './DotLottieCanvas.vue'

defineProps({ message: { type: String, required: true } })
</script>

<template>
  <div class="search-loading" role="status">
    <div class="search-animation">
      <DotLottieCanvas
        :animation-data="MAP_SEARCH_ANIMATION"
        label="지도에서 목적지를 찾는 애니메이션"
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
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  gap: 26px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: var(--surface);
}

.search-animation {
  flex: 0 0 132px;
  width: 132px;
  height: 116px;
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
</style>
