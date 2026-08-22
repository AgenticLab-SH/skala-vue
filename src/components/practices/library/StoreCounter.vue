<script setup>
import { storeToRefs } from 'pinia'

import { useCounterStore } from '../../../stores/counter'

const counterStore = useCounterStore()
// state와 getter는 storeToRefs로 꺼내야 반응형 연결이 유지됩니다.
const { count, doubleCount } = storeToRefs(counterStore)
const { increment } = counterStore
</script>

<template>
  <section class="practice-card">
    <h2>Counter Store</h2>
    <p>원본 카운트: <strong>{{ count }}</strong></p>
    <p>두 배 값: <strong>{{ doubleCount }}</strong></p>
    <el-button @click="increment">숫자 1 증가</el-button>
  </section>
</template>

<style scoped>
p {
  margin: 0 0 8px;
}
</style>
