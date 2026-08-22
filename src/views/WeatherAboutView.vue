<script setup>
import { isOpenWeatherConfigured } from '../services/weatherApi'

const openWeatherReady = isOpenWeatherConfigured()
</script>

<template>
  <div class="about-view">
    <header>
      <p>구현 과정</p>
      <h1>날씨 카드에서<br />이동 판단 서비스로</h1>
      <span>
        수업에서 만든 작은 예제들을 버리지 않고, 실제로 함께 쓰이는 구조로 다시 연결했습니다.
      </span>
    </header>

    <section class="story">
      <p>시작</p>
      <div>
        <h2>처음에는 네 도시의 현재 날씨만 보여 주었습니다.</h2>
        <p>
          카드 컴포넌트, props와 emit, computed를 익히기에는 충분했지만 사용자가 다음 행동을 정하는
          데에는 도움이 적었습니다. 그래서 “날씨가 더 나은 곳으로 움직일 수 없을까?”라는 질문을
          서비스의 출발점으로 삼았습니다.
        </p>
      </div>
    </section>

    <section class="process-grid">
      <article>
        <span>01 · Composition API</span>
        <h2>입력과 결과를 반응형으로 연결했습니다.</h2>
        <p>출발지, 활동, 시간을 ref로 두고 추천 결과와 문구는 computed로 계산했습니다.</p>
      </article>
      <article>
        <span>02 · Components</span>
        <h2>한 화면을 책임 단위로 나눴습니다.</h2>
        <p>
          입력, 대표 추천, 후보 도시, 시간 비교를 컴포넌트로 분리하고 props·emit으로 연결했습니다.
        </p>
      </article>
      <article>
        <span>03 · Pinia</span>
        <h2>화면을 이동해도 선택을 기억합니다.</h2>
        <p>온도 단위와 마지막 검색 조건을 store와 localStorage에 보관했습니다.</p>
      </article>
      <article>
        <span>04 · Router</span>
        <h2>추천과 근거를 별도 주소로 확인합니다.</h2>
        <p>목적지 상세를 동적 경로로 만들고, 검색어와 계획 조건은 query로 전달했습니다.</p>
      </article>
      <article>
        <span>05 · Axios</span>
        <h2>서로 다른 API를 같은 데이터로 바꿨습니다.</h2>
        <p>현재 날씨와 예보를 정규화하여 추천 계산에서는 제공자를 신경 쓰지 않도록 했습니다.</p>
      </article>
      <article>
        <span>06 · Failure UI</span>
        <h2>실패도 화면의 한 상태로 다뤘습니다.</h2>
        <p>일부 도시 실패, 전체 요청 실패, 경로 추정 전환을 숨기지 않고 결과와 함께 표시합니다.</p>
      </article>
    </section>

    <section class="api-flow">
      <div>
        <p>데이터 흐름</p>
        <h2>출발 조건에서 추천까지</h2>
      </div>
      <ol>
        <li><span>1</span>도시 간 이동시간을 추정해 후보를 좁힙니다.</li>
        <li><span>2</span>후보 도시의 시간대별 예보를 가져옵니다.</li>
        <li><span>3</span>이동 가능한 후보를 실제 경로 API로 다시 확인합니다.</li>
        <li><span>4</span>도착 시각의 예보를 골라 활동 점수를 계산합니다.</li>
        <li><span>5</span>출발 시각을 늦춘 경우까지 함께 비교합니다.</li>
      </ol>
    </section>

    <section class="failure-example">
      <div>
        <p>실패 화면</p>
        <h2>API 키가 없는 화면도 직접 확인했습니다.</h2>
        <span>
          개발 중 처음 만난 실패는 OpenWeather 키가 없는 상태였습니다. 버튼만 막는 데서 끝내지 않고
          공개 배포에서도 서비스가 동작하도록 제공자를 전환했습니다.
        </span>
      </div>
      <div class="failure-panel" role="status">
        <span>{{ openWeatherReady ? 'OpenWeather 연결됨' : 'OpenWeather 키 없음' }}</span>
        <strong>
          {{
            openWeatherReady
              ? 'OpenWeather 실제 API로 실행 중입니다.'
              : '공개용 실시간 예보로 전환했습니다.'
          }}
        </strong>
        <p v-if="!openWeatherReady">
          키를 브라우저에 노출하지 않기 위해 Open-Meteo 예보를 사용합니다. `.env.local`에 개인 키가
          있으면 같은 화면에서 OpenWeather 현재 날씨와 5일 예보를 사용합니다.
        </p>
        <p v-else>현재 날씨와 5일/3시간 예보 요청이 모두 OpenWeather를 사용합니다.</p>
      </div>
    </section>

    <section class="limits">
      <p>확인한 한계</p>
      <div>
        <h2>그늘과 비가림 경로는 같은 문제가 아닙니다.</h2>
        <p>
          건물 그림자는 햇빛을 줄이지만 비를 막아 주지는 않습니다. 이번 결과물은 실제 도로의
          그림자를 계산했다고 표현하지 않고, 도시 간 이동과 출발 시간 선택에 집중했습니다. 경로
          서버가 실패하면 직선거리 기반 추정값으로 바뀌며 화면에 출처가 표시됩니다.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-view {
  padding-top: 64px;
}
header p {
  margin: 0 0 18px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
}
header h1 {
  margin: 0;
  font-size: clamp(42px, 8vw, 76px);
  line-height: 1.08;
  letter-spacing: -0.065em;
}
header > span {
  display: block;
  max-width: 650px;
  margin-top: 24px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.75;
}
.story,
.limits {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 24px;
  margin-top: 64px;
  padding: 30px 0;
  border-top: 1px solid var(--ink);
}
.story > p,
.limits > p {
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}
.story h2,
.limits h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.04em;
}
.story div p,
.limits div p {
  max-width: 760px;
  margin: 16px 0 0;
  color: var(--muted);
  line-height: 1.8;
}
.process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 34px;
  border-top: 1px solid var(--line-strong);
  border-left: 1px solid var(--line-strong);
}
.process-grid article {
  min-height: 230px;
  padding: 25px;
  border-right: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
}
.process-grid span {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}
.process-grid h2 {
  margin: 32px 0 12px;
  font-size: 19px;
  line-height: 1.45;
}
.process-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}
.api-flow {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 50px;
  margin-top: 64px;
  padding: 38px;
  background: var(--ink);
  color: #fff;
}
.api-flow p,
.api-flow h2 {
  margin: 0;
}
.api-flow p {
  color: #93b7dd;
  font-size: 12px;
  font-weight: 800;
}
.api-flow h2 {
  margin-top: 12px;
  font-size: 28px;
}
.api-flow ol {
  padding: 0;
  margin: 0;
  list-style: none;
}
.api-flow li {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #3d4147;
}
.api-flow li span {
  color: #93b7dd;
  font-size: 12px;
  font-weight: 800;
}
.failure-example {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 40px;
  margin-top: 64px;
  padding: 34px;
  border: 1px solid var(--line-strong);
}
.failure-example > div > p,
.failure-example h2,
.failure-example span {
  margin: 0;
}
.failure-example > div > p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.failure-example h2 {
  margin: 12px 0;
  font-size: 24px;
  letter-spacing: -0.04em;
}
.failure-example > div > span {
  display: block;
  color: var(--muted);
  line-height: 1.7;
}
.failure-panel {
  padding: 24px;
  border: 1px solid var(--ink);
  background: var(--soft);
}
.failure-panel > span {
  color: var(--accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.failure-panel strong {
  display: block;
  margin-top: 12px;
  font-size: 20px;
}
.failure-panel p {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}
@media (max-width: 760px) {
  .about-view {
    padding-top: 38px;
  }
  .story,
  .limits,
  .api-flow,
  .failure-example {
    grid-template-columns: 1fr;
  }
  .process-grid {
    grid-template-columns: 1fr;
  }
  .process-grid article {
    min-height: auto;
  }
  .api-flow {
    padding: 26px 20px;
  }
}
</style>
