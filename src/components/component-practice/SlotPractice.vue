<script setup>
import { ref } from 'vue'

import BaseSlotCard from './BaseSlotCard.vue'
import NamedSlotCard from './NamedSlotCard.vue'
import ScopedStatus from './ScopedStatus.vue'

const defaultMessage = ref('부모에서 전달한 기본 슬롯 내용입니다.')
</script>

<template>
  <section class="exercise-section" aria-labelledby="slot-title">
    <h2 id="slot-title">Default, Named, Scoped Slot</h2>

    <div class="slot-example">
      <h3>Default Slot</h3>
      <label>
        전달할 기본 내용
        <input v-model="defaultMessage" type="text" />
      </label>
      <BaseSlotCard>
        <p>{{ defaultMessage }}</p>
      </BaseSlotCard>
      <BaseSlotCard />
    </div>

    <div class="slot-example">
      <h3>Named Slot</h3>
      <NamedSlotCard>
        <template #header>
          <h4>부모가 전달한 제목입니다.</h4>
        </template>
        <p>본문도 이름 없는 기본 슬롯으로 전달했습니다.</p>
      </NamedSlotCard>
    </div>

    <div class="slot-example">
      <h3>Scoped Slot</h3>
      <ScopedStatus v-slot="{ message, userCount }">
        <p><strong>부모가 받은 자식 데이터:</strong> {{ message }} ({{ userCount }}명)</p>
      </ScopedStatus>
    </div>
  </section>
</template>

<style scoped>
.exercise-section {
  padding: 18px;
  border: 1px solid #bbb;
}

h2,
h3,
h4,
p {
  margin: 0;
}

h2 {
  margin-bottom: 10px;
  font-size: 22px;
}

h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.slot-example {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #ccc;
}

label {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}
</style>
