<script setup>
import { ref } from 'vue'

const isWarning = ref(false) // 객체 바인딩에서 사용할 조건
const themeClass = ref('bg-dark') // 배열 바인딩에서 항상 적용할 클래스
</script>

<template>
  <section class="practice-section">
    <h2>v-bind 디렉티브 고급 (클래스 바인딩)</h2>
    <h3>클래스 바인딩 (객체 형식)</h3>
    <p :class="{ 'text-danger': isWarning }">현재 경고 상태: {{ isWarning }}</p>
    <button type="button" @click="isWarning = !isWarning">경고 상태 토글</button>
    <br />
    <h3>클래스 바인딩 (배열 형식)</h3>
    <div :class="[themeClass, isWarning ? 'border-red' : 'border-gray']">
      다중 클래스가 조립된 박스 구역입니다.
    </div>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}

.text-danger {
  color: red;
  font-weight: bold;
}

.bg-dark {
  padding: 15px;
  color: white;
  background-color: #333;
}

.border-red {
  border: 3px solid red;
}

.border-gray {
  border: 3px solid #ccc;
}

button {
  padding: 8px 12px;
}
</style>
