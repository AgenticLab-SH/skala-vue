<script setup>
import { ref } from 'vue'

const userCount = ref(3)
const message = '자식 컴포넌트가 전달한 접속 상태입니다.'

function addUser() {
  userCount.value += 1
}
</script>

<template>
  <article class="scoped-card">
    <slot :message="message" :user-count="userCount">
      <p>{{ message }} 현재 접속자는 {{ userCount }}명입니다.</p>
    </slot>
    <button type="button" @click="addUser">접속자 1명 추가</button>
  </article>
</template>

<style scoped>
.scoped-card {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #bbb;
}

button {
  margin-top: 12px;
}
</style>
