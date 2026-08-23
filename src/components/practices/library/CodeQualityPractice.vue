<script setup>
import { computed, ref } from 'vue'

const userAge = ref(20)
const isAgeTwenty = computed(() => userAge.value === 20)
</script>

<template>
  <section id="challenge-270" class="practice-card" tabindex="-1">
    <p class="page-label">270쪽 · ESLint</p>
    <h2>엄격한 비교</h2>
    <el-input-number v-model="userAge" :min="0" :max="100" />
    <p>{{ isAgeTwenty ? '현재 입력값은 20입니다.' : '현재 입력값은 20이 아닙니다.' }}</p>
  </section>
</template>

<style scoped>
p {
  margin: 12px 0 0;
}

.practice-card {
  scroll-margin-top: 108px;
}

.practice-card:focus {
  outline: 0;
}

.page-label {
  margin-top: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
</style>
