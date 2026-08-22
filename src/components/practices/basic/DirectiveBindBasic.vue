<script setup>
import { ref } from 'vue'
import logoImgSrc from '@/assets/logo.svg'

// 교재의 외부 이미지 대신 프로젝트 로고를 사용해 네트워크 영향을 줄였습니다.
const dynamicUrl = 'https://www.naver.com'
const isButtonDisabled = ref(true)
</script>

<template>
  <section class="practice-section">
    <h2>v-bind 디렉티브 기본 (축약형: 콜론)</h2>
    <h3>1) 동적 링크 연결</h3>
    <a :href="dynamicUrl">여기를 클릭하면 네이버로 이동합니다</a>
    <br />
    <h3>2) 동적 이미지 연결</h3>
    <img :src="logoImgSrc" alt="Vue 로고" class="vue-logo" />
    <br />
    <h3>3) 버튼 비활성화 제어</h3>
    <p>현재 버튼 사용 불가능 상태: {{ isButtonDisabled }}</p>
    <button type="button" :disabled="isButtonDisabled">동의해야 클릭할 수 있는 버튼</button>
    <button type="button" @click="isButtonDisabled = !isButtonDisabled">
      위 버튼 잠금 해제/토글하기
    </button>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}

.vue-logo {
  width: 100px;
}

button {
  margin: 4px 8px 4px 0;
  padding: 8px 12px;
}
</style>
