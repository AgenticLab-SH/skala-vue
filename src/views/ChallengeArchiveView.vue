<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import LifecyclePractice from '../components/component-practice/LifecyclePractice.vue'
import PropsEmitsPractice from '../components/component-practice/PropsEmitsPractice.vue'
import ProvideGrandParent from '../components/component-practice/ProvideGrandParent.vue'
import SlotPractice from '../components/component-practice/SlotPractice.vue'
import AxiosJsonPractice from '../components/practices/library/AxiosJsonPractice.vue'
import AxiosWeatherPractice from '../components/practices/library/AxiosWeatherPractice.vue'
import CodeQualityPractice from '../components/practices/library/CodeQualityPractice.vue'
import ElementLibraryPractice from '../components/practices/library/ElementLibraryPractice.vue'
import EnvironmentInfo from '../components/practices/library/EnvironmentInfo.vue'
import StoreCounter from '../components/practices/library/StoreCounter.vue'
import ComputedWatchPractice from '../components/practices/ComputedWatchPractice.vue'
import DirectivePractice from '../components/practices/DirectivePractice.vue'
import EventPractice from '../components/practices/EventPractice.vue'
import FormStylePractice from '../components/practices/FormStylePractice.vue'
import ReactivePractice from '../components/practices/ReactivePractice.vue'
import DirectiveBindBasic from '../components/practices/basic/DirectiveBindBasic.vue'
import DirectiveBindShorthand from '../components/practices/basic/DirectiveBindShorthand.vue'
import DirectiveClassBinding from '../components/practices/basic/DirectiveClassBinding.vue'
import DirectiveHtml from '../components/practices/basic/DirectiveHtml.vue'
import DirectiveStyleBinding from '../components/practices/basic/DirectiveStyleBinding.vue'
import DirectiveText from '../components/practices/basic/DirectiveText.vue'
import DirectiveXss from '../components/practices/basic/DirectiveXss.vue'
import SampleOne from '../components/practices/basic/SampleOne.vue'
import SampleTwo from '../components/practices/basic/SampleTwo.vue'
import WeatherComposition from '../components/weather/WeatherComposition.vue'
import WeatherMockup from '../components/weather/WeatherMockup.vue'

const showLifecycle = ref(true)
const lifecycleMessage = ref('컴포넌트를 화면에 넣으면 mounted 상태가 표시됩니다.')
const route = useRoute()
const challengePages = [
  72, 93, 105, 115, 126, 144, 155, 172, 177, 211, 229, 246, 247, 248, 270, 271, 272, 273,
]

function updateLifecycleMessage(event) {
  lifecycleMessage.value = event.message
}

async function focusChallenge(hash) {
  if (!hash.startsWith('#challenge-')) return
  await nextTick()
  document.getElementById(hash.slice(1))?.focus({ preventScroll: true })
}

watch(() => route.hash, focusChallenge)
onMounted(() => focusChallenge(route.hash))
</script>

<template>
  <section class="archive-view">
    <header class="archive-intro">
      <p>수업 실습 기록</p>
      <h1>코드 챌린지를 페이지 순서대로 정리했습니다.</h1>
      <span>각 항목에서 수업 예제의 실행 결과를 직접 확인할 수 있습니다.</span>
    </header>

    <nav class="chapter-index" aria-label="코드 챌린지 목차">
      <RouterLink
        v-for="page in challengePages"
        :key="page"
        :to="{ name: 'challenge-archive', hash: `#challenge-${page}` }"
      >
        {{ page }}쪽
      </RouterLink>
    </nav>

    <section
      id="challenge-72"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-72-title"
    >
      <header class="section-header">
        <p>72쪽 코드 챌린지</p>
        <h2 id="challenge-72-title">Vue 문법</h2>
      </header>
      <div class="challenge-stack"><SampleOne /><SampleTwo /></div>
    </section>

    <section
      id="challenge-93"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-93-title"
    >
      <header class="section-header">
        <p>93쪽 코드 챌린지</p>
        <h2 id="challenge-93-title">Vue 디렉티브</h2>
      </header>
      <div class="challenge-stack">
        <DirectiveHtml /><DirectiveXss /><DirectiveText /><DirectiveBindBasic />
        <DirectiveClassBinding /><DirectiveStyleBinding /><DirectiveBindShorthand />
        <DirectivePractice />
      </div>
    </section>

    <section
      id="challenge-105"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-105-title"
    >
      <header class="section-header">
        <p>105쪽 코드 챌린지</p>
        <h2 id="challenge-105-title">Vue 이벤트 처리</h2>
      </header>
      <EventPractice />
    </section>

    <section
      id="challenge-115"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-115-title"
    >
      <header class="section-header">
        <p>115쪽 코드 챌린지</p>
        <h2 id="challenge-115-title">Vue 폼 처리와 스타일</h2>
      </header>
      <FormStylePractice />
    </section>

    <section class="practice-section" aria-labelledby="practice-116-title">
      <header class="section-header">
        <p>116쪽 실습</p>
        <h2 id="practice-116-title">날씨 목업</h2>
      </header>
      <WeatherMockup />
    </section>

    <section
      id="challenge-126"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-126-title"
    >
      <header class="section-header">
        <p>126쪽 코드 챌린지</p>
        <h2 id="challenge-126-title">반응형 상태</h2>
      </header>
      <ReactivePractice />
    </section>

    <section
      id="challenge-144"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-144-title"
    >
      <header class="section-header">
        <p>144쪽 코드 챌린지</p>
        <h2 id="challenge-144-title">계산 속성과 감시자</h2>
      </header>
      <ComputedWatchPractice />
    </section>

    <section class="practice-section" aria-labelledby="practice-145-title">
      <header class="section-header">
        <p>145쪽 실습</p>
        <h2 id="practice-145-title">날씨 Composition</h2>
      </header>
      <WeatherComposition />
    </section>

    <section
      id="challenge-155"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-155-title"
    >
      <header class="section-header">
        <p>155쪽 코드 챌린지</p>
        <h2 id="challenge-155-title">컴포넌트 라이프사이클</h2>
      </header>
      <div class="challenge-stack">
        <LifecyclePractice v-if="showLifecycle" @lifecycle-event="updateLifecycleMessage" />
        <section class="result-box" aria-live="polite">
          <p><strong>부모가 받은 상태:</strong> {{ lifecycleMessage }}</p>
          <button type="button" @click="showLifecycle = !showLifecycle">
            {{
              showLifecycle ? '라이프사이클 컴포넌트 숨기기' : '라이프사이클 컴포넌트 다시 표시하기'
            }}
          </button>
        </section>
      </div>
    </section>

    <section class="practice-section" aria-labelledby="practice-169-title">
      <header class="section-header">
        <p>169~171쪽 실습</p>
        <h2 id="practice-169-title">Provide / Inject</h2>
      </header>
      <ProvideGrandParent />
    </section>

    <section
      id="challenge-172"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-172-title"
    >
      <header class="section-header">
        <p>172쪽 코드 챌린지</p>
        <h2 id="challenge-172-title">Props &amp; Emits</h2>
      </header>
      <PropsEmitsPractice />
    </section>

    <section
      id="challenge-177"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-177-title"
    >
      <header class="section-header">
        <p>177쪽 코드 챌린지</p>
        <h2 id="challenge-177-title">컴포넌트 슬롯</h2>
      </header>
      <SlotPractice />
    </section>

    <section
      id="challenge-211"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-211-title"
    >
      <header class="section-header">
        <p>211쪽 코드 챌린지</p>
        <h2 id="challenge-211-title">Pinia Store</h2>
      </header>
      <StoreCounter />
    </section>

    <section
      id="challenge-229"
      class="challenge-section"
      tabindex="-1"
      aria-labelledby="challenge-229-title"
    >
      <header class="section-header">
        <p>229쪽 코드 챌린지</p>
        <h2 id="challenge-229-title">Axios 요청</h2>
      </header>
      <div class="challenge-stack"><AxiosWeatherPractice /><AxiosJsonPractice /></div>
    </section>

    <section class="challenge-section" aria-labelledby="challenge-246-title">
      <header class="section-header">
        <p>246~248쪽 코드 챌린지</p>
        <h2 id="challenge-246-title">Element Plus</h2>
      </header>
      <ElementLibraryPractice />
    </section>

    <section class="challenge-section" aria-labelledby="challenge-270-title">
      <header class="section-header">
        <p>270~273쪽 코드 챌린지</p>
        <h2 id="challenge-270-title">코드 품질과 환경 변수</h2>
      </header>
      <div class="challenge-stack"><CodeQualityPractice /><EnvironmentInfo /></div>
    </section>
  </section>
</template>

<style scoped>
.archive-view {
  padding-top: 56px;
}

.archive-intro {
  max-width: 820px;
  margin-bottom: 38px;
}

.archive-intro p,
.archive-intro h1,
.archive-intro span {
  margin: 0;
}

.archive-intro p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.archive-intro h1 {
  margin-top: 12px;
  font-size: clamp(38px, 6vw, 62px);
  line-height: 1.1;
  letter-spacing: -0.055em;
  word-break: keep-all;
}

.archive-intro span {
  display: block;
  margin-top: 16px;
  color: var(--muted);
  line-height: 1.7;
}

.chapter-index {
  position: sticky;
  z-index: 7;
  top: 92px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
  box-shadow: 0 10px 26px rgba(23, 35, 48, 0.1);
  backdrop-filter: blur(20px) saturate(145%);
  -webkit-backdrop-filter: blur(20px) saturate(145%);
}

.chapter-index a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--ink);
}

.challenge-section,
.practice-section {
  margin-top: 42px;
  scroll-margin-top: 176px;
}

.challenge-section:focus {
  outline: 0;
}

.section-header {
  margin-bottom: 20px;
}

.section-header p,
h2 {
  margin: 0;
}

.section-header > p:first-child {
  margin-bottom: 6px !important;
  font-size: 14px;
}

h2 {
  margin-bottom: 8px;
  font-size: 24px;
}

.challenge-stack {
  display: grid;
  gap: 16px;
}

.result-box {
  padding: 16px;
  border: 1px solid #bbb;
}

.result-box p {
  margin: 0 0 12px;
}

@media (max-width: 640px) {
  .archive-view {
    padding-top: 36px;
  }

  h2 {
    font-size: 21px;
  }

  .chapter-index {
    top: 126px;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 16px;
    scrollbar-width: none;
  }

  .chapter-index::-webkit-scrollbar {
    display: none;
  }

  .chapter-index a {
    flex: 0 0 auto;
  }

  .challenge-section,
  .practice-section {
    scroll-margin-top: 202px;
  }
}
</style>
