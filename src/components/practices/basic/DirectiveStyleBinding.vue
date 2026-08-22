<script setup>
import { ref } from 'vue'

const textColor = ref('purple')
const boxWidth = ref(150)

// 공통 스타일과 실시간으로 바뀌는 width를 배열로 합쳐서 적용합니다.
const baseBoxStyle = ref({
  backgroundColor: '#42b883',
  height: '100px',
  transition: 'all 0.3s ease',
})
</script>

<template>
  <section class="practice-section">
    <h2>v-bind 디렉티브 고급 (스타일 바인딩)</h2>
    <h3>1) 인라인 스타일 변수 조작 (객체 형식)</h3>
    <p :style="{ color: textColor, fontWeight: 'bold' }">이 글자의 색상은 실시간으로 바뀝니다.</p>
    <button type="button" @click="textColor = textColor === 'purple' ? 'blue' : 'purple'">
      글자 색상 토글
    </button>
    <br />
    <h3>2) 다중 스타일 객체 조립 (배열 형식)</h3>
    <label for="box-width">박스 가로 크기(px): </label>
    <input id="box-width" v-model="boxWidth" type="number" step="50" />
    <br />
    <div class="size-box" :style="[baseBoxStyle, { width: boxWidth + 'px' }]">
      <p>가로 크기: {{ boxWidth }}px 박스</p>
    </div>
  </section>
</template>

<style scoped>
.practice-section {
  overflow: hidden;
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}

button,
input {
  padding: 8px 12px;
}

.size-box {
  max-width: 100%;
  margin-top: 8px;
}

.size-box p {
  padding: 10px;
  color: white;
  text-align: center;
}
</style>
