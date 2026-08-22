<script setup>
import { inject, ref } from 'vue'

const studyMode = inject('studyMode', ref('제공된 값이 없습니다.'))
const guideText = inject('guideText', ref('안내가 없습니다.'))
const toggleStudyMode = inject('toggleStudyMode', () => {})
</script>

<template>
  <div class="grand-child-area">
    <p><strong>하위 컴포넌트가 inject한 상태:</strong> {{ studyMode }}</p>
    <p>{{ guideText }}</p>
    <button type="button" @click="toggleStudyMode">하위 컴포넌트에서 상태 바꾸기</button>
  </div>
</template>

<style scoped>
.grand-child-area {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid #777;
}

p {
  margin: 0;
}

p + p {
  margin-top: 6px;
}

button {
  margin-top: 12px;
}
</style>
