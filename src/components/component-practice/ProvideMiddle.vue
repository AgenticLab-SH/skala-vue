<script setup>
import ProvideGrandChild from './ProvideGrandChild.vue'
</script>

<template>
  <div class="middle-area">
    <p>중간 컴포넌트는 props 없이 하위 컴포넌트를 배치합니다.</p>
    <ProvideGrandChild />
  </div>
</template>

<style scoped>
.middle-area {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #bbb;
}

p {
  margin: 0;
}
</style>
