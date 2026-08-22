<script setup>
import { ref } from 'vue'

import MessageEditorChild from './MessageEditorChild.vue'
import WeatherInfoCard from './WeatherInfoCard.vue'

const parentMessage = ref('부모의 초기 메시지입니다.')
const selectedCityMessage = ref('아직 선택한 도시가 없습니다.')

const weatherCards = [
  {
    id: 'seoul',
    cityName: '서울',
    temperature: 28,
    condition: '맑음',
    alertLevel: '주의',
    tags: ['반팔', '물 챙기기'],
    checkedInfo: { time: '09:00', source: '직접 입력한 예시 데이터' },
  },
  {
    id: 'changwon',
    cityName: '창원',
    temperature: 24,
    condition: '구름 많음',
    alertLevel: '보통',
    tags: ['얇은 겉옷'],
    checkedInfo: { time: '09:00', source: '직접 입력한 예시 데이터' },
  },
]

function updateParentMessage(nextMessage) {
  parentMessage.value = nextMessage
}

function selectCity(city) {
  selectedCityMessage.value = `${city.cityName} 카드 선택 이벤트를 받았습니다.`
}
</script>

<template>
  <section class="exercise-section" aria-labelledby="props-emits-title">
    <h2 id="props-emits-title">부모와 자식이 값을 주고받기</h2>

    <div class="message-example">
      <h3>부모 메시지 예제</h3>
      <p><strong>부모 상태:</strong> {{ parentMessage }}</p>
      <MessageEditorChild :parent-data="parentMessage" @update-request="updateParentMessage" />
    </div>

    <div class="weather-card-list">
      <h3>날씨 카드 props 예제</h3>
      <p class="selected-message" aria-live="polite">{{ selectedCityMessage }}</p>
      <WeatherInfoCard
        v-for="city in weatherCards"
        :key="city.id"
        :city-id="city.id"
        :city-name="city.cityName"
        :temperature="city.temperature"
        :condition="city.condition"
        :alert-level="city.alertLevel"
        :tags="city.tags"
        :checked-info="city.checkedInfo"
        @select-city="selectCity"
      />
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

.message-example,
.weather-card-list {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #ccc;
}

.selected-message {
  margin-bottom: 10px;
}
</style>
