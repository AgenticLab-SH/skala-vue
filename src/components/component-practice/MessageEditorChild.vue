<script setup>
import { ref } from 'vue'

defineProps({
  parentData: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update-request'])
const nextMessage = ref('자식 컴포넌트에서 변경을 요청했습니다.')

function requestUpdate() {
  emit('update-request', nextMessage.value)
}
</script>

<template>
  <div class="child-area">
    <p><strong>자식이 받은 props:</strong> {{ parentData }}</p>
    <label>
      부모에게 보낼 메시지
      <input v-model="nextMessage" type="text" />
    </label>
    <button type="button" @click="requestUpdate">변경 요청 보내기</button>
  </div>
</template>

<style scoped>
.child-area {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid #bbb;
}

p {
  margin: 0;
}

label {
  display: grid;
  gap: 6px;
}

button {
  justify-self: start;
}
</style>
