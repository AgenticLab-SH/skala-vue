<script setup>
import { ref } from 'vue'

// 일반 변수는 값이 바뀌어도 Vue가 화면을 다시 그리지는 않습니다.
let normalCount = 0

// ref로 만든 변수는 값이 바뀌면 Vue가 화면을 다시 그립니다.
const vueCount = ref(0)

function increaseNormalCount() {
  normalCount += 1
  console.log('일반 변수 값:', normalCount)
}
</script>

<template>
  <section class="practice-section">
    <h2>일반 변수와 반응성 변수 비교</h2>
    <h3>일반 변수 클릭: {{ normalCount }}</h3>
    <button type="button" @click="increaseNormalCount">일반 변수 증가</button>
    <p>일반 변수의 변경 값은 콘솔에서 확인합니다.</p>
    <br />
    <h3>Vue 반응성 변수 클릭: {{ vueCount }}</h3>
    <button type="button" @click="vueCount++">Vue 변수 증가</button>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #bbb;
}
</style>
