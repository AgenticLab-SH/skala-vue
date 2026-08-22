<script setup>
import logoUrl from '@/assets/logo.svg'

// HTML 속성명과 변수명이 같아서 :id, :src처럼 줄여 쓸 수 있습니다.
const id = 'user-profile-card'
const src = logoUrl
</script>

<template>
  <section class="practice-section">
    <h2>v-bind 디렉티브 고급 (단축 문법)</h2>
    <div :id>
      <img :src alt="Vue 로고" class="vue-logo" />
    </div>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}

.vue-logo {
  width: 50px;
}
</style>
