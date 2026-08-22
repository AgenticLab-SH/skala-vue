<script setup>
import { isOpenWeatherConfigured } from '../services/weatherApi'

const openWeatherReady = isOpenWeatherConfigured()

const lessons = [
  {
    pages: '126·144쪽',
    topic: '반응형 상태와 계산 속성',
    use: '출발 조건은 ref로 관리하고, 선택한 도시와 추천 문구는 computed로 계산했습니다.',
  },
  {
    pages: '146~177쪽',
    topic: '컴포넌트, Props·Emits, Slot',
    use: '입력, 추천, 후보, 시간 비교, 경로 지도를 나누고 부모 화면에서 결과를 연결했습니다.',
  },
  {
    pages: '178~197쪽',
    topic: 'Vue Router',
    use: '추천·도시 목록·상세·구현 과정·실습 기록을 경로로 분리했습니다.',
  },
  {
    pages: '198~211쪽',
    topic: 'Pinia',
    use: '온도 단위, 관심 도시, 마지막 출발 조건과 날씨 효과 설정을 화면 사이에서 유지했습니다.',
  },
  {
    pages: '212~229쪽',
    topic: 'Axios',
    use: '날씨와 경로 API를 요청하고 서로 다른 응답을 같은 형태로 정리했습니다.',
  },
  {
    pages: '230~273쪽',
    topic: 'UI 라이브러리와 빌드 환경',
    use: 'Element Plus는 필요한 컴포넌트만 등록하고 환경별 빌드를 따로 확인했습니다.',
  },
]
</script>

<template>
  <div class="process-view">
    <header class="page-intro">
      <p>구현 과정</p>
      <h1>날씨 카드를<br />이동 추천으로 확장했습니다.</h1>
      <span>수업에서 배운 기능을 따로 나열하지 않고, 한 번의 계획 흐름 안에 연결했습니다.</span>
    </header>

    <section class="origin-section">
      <p>시작</p>
      <div>
        <h2>현재 날씨만 보여 주는 화면에서 출발했습니다.</h2>
        <p>
          처음에는 서울·수원·창원·부산의 날씨 카드를 만들었습니다. 카드를 읽은 다음 무엇을 할 수
          있을지 고민하다가, 도착할 시간의 예보를 비교해 갈 곳을 정하는 기능으로 방향을 바꿨습니다.
        </p>
      </div>
    </section>

    <section class="learning-section" aria-labelledby="learning-title">
      <div class="section-title">
        <p>수업 내용 적용</p>
        <h2 id="learning-title">배운 개념이 실제로 쓰인 곳</h2>
      </div>
      <div class="learning-list">
        <article v-for="lesson in lessons" :key="lesson.pages">
          <span>{{ lesson.pages }}</span>
          <strong>{{ lesson.topic }}</strong>
          <p>{{ lesson.use }}</p>
        </article>
      </div>
    </section>

    <section class="flow-section" aria-labelledby="flow-title">
      <div class="section-title">
        <p>데이터 흐름</p>
        <h2 id="flow-title">입력에서 경로까지</h2>
      </div>
      <ol>
        <li><span>1</span>이동 가능한 도시를 먼저 고릅니다.</li>
        <li><span>2</span>도착 시각과 가까운 예보를 찾습니다.</li>
        <li><span>3</span>활동별 기준으로 점수와 이유를 계산합니다.</li>
        <li><span>4</span>도착 예보를 비·구름·안개·눈 화면 효과로 구분합니다.</li>
        <li><span>5</span>OSRM 경로 좌표를 지도에 그리고 목적지 건물을 3D로 표시합니다.</li>
        <li><span>6</span>전국 대표 지점의 현재 강수량과 운량을 받아 날씨 지도에 표시합니다.</li>
      </ol>
    </section>

    <section class="failure-section" aria-labelledby="failure-title">
      <div class="section-title">
        <p>실패와 수정</p>
        <h2 id="failure-title">기능을 멈추지 않는 쪽으로 고쳤습니다.</h2>
      </div>
      <div class="failure-list">
        <article>
          <strong>API 키가 없었습니다.</strong>
          <p>
            공개 화면에 키를 넣는 대신 Open-Meteo로 전환했습니다. 로컬에 개인 키가 있으면 수업에서
            사용한 OpenWeather 요청을 그대로 확인할 수 있습니다.
          </p>
        </article>
        <article>
          <strong>경로 요청이 실패하면 추천도 사라졌습니다.</strong>
          <p>추천은 유지하고 직선거리 기반 시간과 추정선을 표시하도록 바꿨습니다.</p>
        </article>
        <article>
          <strong>3D 건물이 콘솔 오류로 보이지 않았습니다.</strong>
          <p>
            건물 바닥 높이에 중첩한 zoom 조건이 MapLibre 표현식 규칙에 맞지 않았습니다. zoom은 높이
            보간에만 쓰고 바닥 값은 건물 데이터에서 바로 읽도록 수정했습니다.
          </p>
        </article>
        <article>
          <strong>흐림 효과가 단순한 회색 배경처럼 보였습니다.</strong>
          <p>
            처음에는 구름과 배경의 명도가 비슷해 상태를 구분하기 어려웠습니다. 화면을 가리지 않는
            범위에서 구름층의 명암만 조정하고, 도시명과 날씨 문구를 함께 남겼습니다.
          </p>
        </article>
        <article>
          <strong>지도를 움직여도 비 오는 지역을 찾을 수 없었습니다.</strong>
          <p>
            화면에 내리던 비는 한 도시의 상태만 표현하고 지도 좌표와는 연결되지 않았습니다. 전국
            대표 지점의 현재 강수량과 운량을 따로 요청해 비·흐림 지도와 텍스트 목록을 함께
            만들었습니다.
          </p>
        </article>
      </div>
      <div class="runtime-status" role="status">
        <span>현재 실행 환경</span>
        <strong>{{ openWeatherReady ? 'OpenWeather 연결' : 'Open-Meteo 공개 예보 사용' }}</strong>
      </div>
    </section>

    <section class="limit-section">
      <p>현재 범위</p>
      <div>
        <h2>날씨 지역 비교와 이동선, 3D 건물까지 구현했습니다.</h2>
        <p>
          날씨 지도는 전국 28개 대표 지점의 현재 모델값을 비교하며 행정구역 경계나 기상 레이더는
          아닙니다. 이동 지도는 실제 도로 경로를 보여 주지만 건물 그림자나 비가림 구간은 계산하지
          않습니다. 그늘 우선 경로는 건물 높이, 태양 위치, 보행 경로를 함께 계산해야 하므로 다음
          단계로 남겼습니다.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.process-view {
  padding-top: 58px;
}

.page-intro p,
.page-intro h1,
.page-intro span {
  margin: 0;
}

.page-intro > p,
.section-title > p,
.origin-section > p,
.limit-section > p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.page-intro h1 {
  max-width: 860px;
  margin-top: 16px;
  font-size: clamp(42px, 8vw, 76px);
  line-height: 1.06;
  letter-spacing: -0.065em;
}

.page-intro span {
  display: block;
  max-width: 640px;
  margin-top: 22px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.75;
}

.origin-section,
.limit-section {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 24px;
  margin-top: 62px;
  padding: 30px 0;
  border-top: 1px solid var(--ink);
}

.origin-section > p,
.origin-section h2,
.origin-section div p,
.limit-section > p,
.limit-section h2,
.limit-section div p,
.section-title p,
.section-title h2 {
  margin: 0;
}

.origin-section h2,
.limit-section h2,
.section-title h2 {
  font-size: 26px;
  letter-spacing: -0.04em;
}

.origin-section div p,
.limit-section div p {
  max-width: 780px;
  margin-top: 14px;
  color: var(--muted);
  line-height: 1.8;
}

.learning-section,
.flow-section,
.failure-section {
  margin-top: 56px;
}

.section-title h2 {
  margin-top: 8px;
}

.learning-list {
  margin-top: 22px;
  border-top: 1px solid var(--line-strong);
}

.learning-list article {
  display: grid;
  grid-template-columns: 110px minmax(180px, 0.8fr) 1.6fr;
  gap: 22px;
  align-items: start;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}

.learning-list span {
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
}

.learning-list p,
.failure-list p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.flow-section {
  display: grid;
  grid-template-columns: 0.75fr 1.25fr;
  gap: 50px;
  padding: 34px;
  border-radius: 18px;
  background: var(--ink);
  color: #fff;
}

.flow-section .section-title > p {
  color: #9fc6f3;
}

.flow-section ol {
  padding: 0;
  margin: 0;
  list-style: none;
}

.flow-section li {
  display: flex;
  gap: 14px;
  padding: 13px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.flow-section li span {
  color: #9fc6f3;
  font-size: 12px;
  font-weight: 800;
}

.failure-list {
  margin-top: 22px;
  border-top: 1px solid var(--line-strong);
}

.failure-list article {
  display: grid;
  grid-template-columns: minmax(220px, 0.75fr) 1.25fr;
  gap: 24px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}

.runtime-status {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}

.runtime-status span {
  color: var(--muted);
}

@media (max-width: 760px) {
  .process-view {
    padding-top: 38px;
  }

  .origin-section,
  .limit-section,
  .flow-section,
  .learning-list article,
  .failure-list article {
    grid-template-columns: 1fr;
  }

  .origin-section,
  .limit-section {
    gap: 12px;
  }

  .learning-list article,
  .failure-list article {
    gap: 8px;
  }

  .flow-section {
    gap: 28px;
    padding: 26px 20px;
  }

  .runtime-status {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
