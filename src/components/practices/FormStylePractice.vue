<script setup>
import { ref } from 'vue'

import '../../assets/challenge.css'

const name = ref('')
const introduction = ref('')
const agreed = ref(false)
const interests = ref([])
const track = ref('frontend')
const city = ref('서울')
const age = ref(20)
const lazyMemo = ref('')
</script>

<template>
  <div class="practice-grid">
    <article class="practice-card">
      <h2>폼 요소와 v-model</h2>
      <div class="form-stack">
        <label>이름 <input v-model.trim="name" placeholder="이름" /></label>
        <label>소개 <textarea v-model="introduction" rows="3"></textarea></label>
        <label><input v-model="agreed" type="checkbox" /> 개인정보 수집 동의</label>
        <fieldset>
          <legend>관심 분야</legend>
          <label><input v-model="interests" type="checkbox" value="Vue" /> Vue</label>
          <label><input v-model="interests" type="checkbox" value="JavaScript" /> JavaScript</label>
        </fieldset>
        <fieldset>
          <legend>희망 트랙</legend>
          <label><input v-model="track" type="radio" value="frontend" /> 프론트엔드</label>
          <label><input v-model="track" type="radio" value="backend" /> 백엔드</label>
        </fieldset>
        <label>
          지역
          <select v-model="city">
            <option>서울</option>
            <option>수원</option>
            <option>부산</option>
          </select>
        </label>
      </div>
      <p class="result">
        {{ name || '이름 없음' }} / {{ city }} / {{ interests.join(', ') || '관심 분야 없음' }}
      </p>
    </article>

    <article class="practice-card">
      <h2>v-model 수식어</h2>
      <label>나이(.number) <input v-model.number="age" type="number" /></label>
      <label
        >메모(.lazy) <input v-model.lazy.trim="lazyMemo" placeholder="다른 곳을 클릭하면 반영"
      /></label>
      <p class="result">나이 타입: {{ typeof age }}, 메모: {{ lazyMemo || '아직 반영 전' }}</p>
    </article>

    <article class="practice-card scoped-style-box">
      <h2>컴포넌트 스타일</h2>
      <p>이 테두리는 이 컴포넌트의 <code>scoped</code> 스타일입니다.</p>
      <p class="external-style-box">
        이 영역은 <code>src/assets/challenge.css</code>에서 가져왔습니다.
      </p>
    </article>
  </div>
</template>

<style scoped>
.form-stack {
  display: grid;
  gap: 0.8rem;
}

label {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

fieldset {
  border: 1px solid;
}

.scoped-style-box {
  border-style: dashed;
}
</style>
