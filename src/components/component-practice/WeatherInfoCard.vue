<script setup>
const props = defineProps({
  cityId: {
    type: String,
    required: true,
  },
  cityName: {
    type: String,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  condition: {
    type: String,
    default: '정보 없음',
  },
  alertLevel: {
    type: String,
    default: '보통',
    validator: (value) => ['보통', '주의', '경고'].includes(value),
  },
  tags: {
    type: Array,
    default: () => [],
  },
  checkedInfo: {
    type: Object,
    default: () => ({ time: '-', source: '-' }),
  },
})

const emit = defineEmits(['select-city'])

function requestSelection() {
  emit('select-city', { cityId: props.cityId, cityName: props.cityName })
}
</script>

<template>
  <article class="weather-card">
    <h4>{{ cityName }}</h4>
    <p>{{ temperature }}℃ · {{ condition }} · {{ alertLevel }}</p>
    <p>확인: {{ checkedInfo.time }} / {{ checkedInfo.source }}</p>
    <ul v-if="tags.length">
      <li v-for="tag in tags" :key="tag">{{ tag }}</li>
    </ul>
    <button type="button" @click="requestSelection">{{ cityName }} 선택</button>
  </article>
</template>

<style scoped>
.weather-card {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #bbb;
}

h4,
p,
ul {
  margin: 0;
}

h4 {
  margin-bottom: 6px;
  font-size: 17px;
}

p + p {
  margin-top: 6px;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
  padding-left: 18px;
}

button {
  margin-top: 12px;
}
</style>
