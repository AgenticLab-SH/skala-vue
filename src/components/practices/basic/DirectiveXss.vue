<script setup>
import { ref } from 'vue'

const inputValue = ref('')
const message = ref('')
const trustedExample = '<strong>작성한 문장은 아래에서 문자 그대로 표시됩니다.</strong>'

function showMessage() {
  // 입력값은 HTML로 해석하지 않고 보간법으로 출력합니다. 태그를 넣어 보면 차이가 바로 보입니다.
  message.value = inputValue.value
}
</script>

<template>
  <section class="practice-section">
    <h2>v-html와 XSS 유의점</h2>
    <p class="warning">신뢰할 수 없는 입력은 v-html로 렌더링하면 안 됩니다.</p>
    <p v-html="trustedExample"></p>
    <div class="input-row">
      <input
        v-model="inputValue"
        aria-label="안전하게 출력할 내용"
        placeholder="내용을 입력하세요"
      />
      <button type="button" @click="showMessage">확인</button>
    </div>
    <div class="message">{{ message }}</div>
  </section>
</template>

<style scoped>
.practice-section {
  padding: 20px;
  border: 1px solid #d9e2e8;
  border-radius: 8px;
}

.warning {
  color: #b42318;
  font-weight: 700;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

input,
button {
  padding: 8px 12px;
}

.message {
  margin-top: 12px;
}
</style>
