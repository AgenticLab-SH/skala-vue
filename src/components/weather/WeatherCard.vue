<script setup>
import { computed } from 'vue'

import { useConfigStore } from '../../stores/configStore'

const props = defineProps({
  city: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  selectable: { type: Boolean, default: true },
  showDetail: { type: Boolean, default: true },
})

const emit = defineEmits(['select-card', 'click-detail', 'toggle-favorite'])
const configStore = useConfigStore()

const displayTemperature = computed(() => {
  if (configStore.unit === 'fahrenheit') {
    return Math.round((props.city.temperature * 9) / 5 + 32)
  }
  return props.city.temperature
})
</script>

<template>
  <el-card class="weather-card" :class="{ selected }" shadow="never">
    <p class="region">{{ city.region }}</p>
    <h3>{{ city.name }}</h3>
    <p class="temperature">{{ displayTemperature }}{{ configStore.unitSymbol }}</p>
    <p>{{ city.condition }} · 습도 {{ city.humidity }}%</p>
    <el-tag effect="plain" :type="city.temperature >= 25 ? 'warning' : 'info'">
      {{ city.temperature >= 25 ? '더움' : '선선함' }}
    </el-tag>
    <el-tag v-if="favorite" class="favorite-tag" effect="plain" type="success">관심 도시</el-tag>
    <div v-if="selectable || showDetail" class="card-actions">
      <el-button v-if="selectable" @click="emit('select-card', city)">선택</el-button>
      <el-button v-if="showDetail" type="primary" plain @click="emit('click-detail', city)">
        상세 보기
      </el-button>
      <el-button v-if="selectable" text @click="emit('toggle-favorite', city)">
        {{ favorite ? '관심 해제' : '관심 등록' }}
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.weather-card {
  height: 100%;
}

.weather-card.selected {
  outline: 2px solid #555;
  outline-offset: -2px;
}

.region,
h3 {
  margin: 0;
}

.region {
  font-size: 14px;
}

h3 {
  margin-top: 4px;
  font-size: 22px;
}

.temperature {
  margin: 16px 0 4px;
  font-size: 28px;
  font-weight: 700;
}

.favorite-tag {
  margin-left: 6px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.card-actions button {
  flex: 1 1 auto;
}
</style>
