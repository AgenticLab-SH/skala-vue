<script setup>
const lessons = [
  {
    pages: '126·144쪽',
    topic: '반응형 상태와 계산 속성',
    use: '출발 조건과 API 상태는 ref로 관리하고, 선택한 도시와 추천 결과는 computed로 계산했습니다.',
  },
  {
    pages: '146~177쪽',
    topic: '컴포넌트, Props·Emits, Slot',
    use: '입력 폼, 추천 결과, 후보 목록, 시간 비교와 경로 지도를 컴포넌트로 나눠 연결했습니다.',
  },
  {
    pages: '178~197쪽',
    topic: 'Vue Router',
    use: '이동 추천, 도시별 날씨, 상세 화면, 구현 기록과 수업 실습 기록을 경로로 분리했습니다.',
  },
  {
    pages: '198~211쪽',
    topic: 'Pinia',
    use: '온도 단위, 관심 도시, 마지막 출발 조건과 날씨 효과 설정을 화면 사이에서 유지했습니다.',
  },
  {
    pages: '212~229쪽',
    topic: 'Axios',
    use: '날씨와 경로 API를 요청하고 제공자마다 다른 응답을 서비스에서 쓰는 형태로 정리했습니다.',
  },
  {
    pages: '230~273쪽',
    topic: 'UI 라이브러리와 빌드 환경',
    use: 'Element Plus는 필요한 컴포넌트만 등록하고, 환경별 빌드와 GitHub Pages 배포를 확인했습니다.',
  },
]

const troubleshooting = [
  {
    problem: '활동을 바꿔도 추천 장소가 같았습니다.',
    cause: '날씨 점수만 바꾸고 관광지 목록은 공통으로 사용했습니다.',
    fix: '도시별로 러닝·등산·바다·풋살·자전거 장소를 나누고, 선택한 활동이 가능한 도시만 비교했습니다.',
  },
  {
    problem: 'OpenWeather 키를 공개 화면에 둘 수 없었습니다.',
    cause: 'Vite 환경 변수는 빌드 결과에 포함될 수 있었습니다.',
    fix: '배포 작업에서만 키를 사용해 18개 도시 예보 파일을 만들고, 화면은 키가 빠진 결과만 읽게 했습니다.',
  },
  {
    problem: '경로 요청이 실패하면 추천도 사라졌습니다.',
    cause: '경로와 날씨 요청을 하나의 성공 조건으로 묶었습니다.',
    fix: '경로 실패는 직선거리 추정으로 처리하고, 확인된 날씨 추천은 그대로 남겼습니다.',
  },
  {
    problem: '건물 그림자가 계산돼도 지도에서 잘 보이지 않았습니다.',
    cause: '그림자 면과 3D 건물 바닥의 색 차이가 작았습니다.',
    fix: '그림자 면과 외곽선의 대비를 높이고, 도착 기준 시각과 같은 색의 범례를 지도 안에 표시했습니다.',
  },
  {
    problem: '비·흐림 효과가 글과 버튼을 가렸습니다.',
    cause: '날씨 모션을 콘텐츠 위의 화면 오버레이로 올렸습니다.',
    fix: '효과를 배경 계층으로 내리고 맑음·흐림·비·눈·안개만 배경색과 모션으로 구분했습니다.',
  },
  {
    problem: '한 경로만으로는 그늘이 더 많은 길을 고를 수 없었습니다.',
    cause: '비교할 경로 대안을 요청하지 않았습니다.',
    fix: 'OSRM 경로 대안을 받아 지도 안 건물 그림자와 겹치는 비율, 추가 시간을 함께 비교했습니다.',
  },
]
</script>

<template>
  <article class="process-view">
    <header class="page-intro">
      <h1>날씨를 확인한 다음 행동까지 이어지게 만들었습니다.</h1>
      <p>현재 날씨 카드에서 시작해, 도착 날씨와 활동 장소를 비교하는 서비스로 확장했습니다.</p>
    </header>

    <section class="reason-section" aria-labelledby="reason-title">
      <h2 id="reason-title">구현 이유와 과정</h2>
      <div>
        <h3>그늘길의 시간대별 건물 그림자에서 아이디어를 얻었습니다.</h3>
        <p>
          같은 길도 시간과 햇빛에 따라 걷기 편한 정도가 달라지는 점이 흥미로웠습니다. 여기서 날씨도
          단순히 현재 상태를 보는 정보가 아니라, 출발 시간이나 목적지를 바꾸는 기준으로 사용할 수
          있겠다고 생각했습니다.
        </p>
        <p>
          처음에는 서울·수원·창원·부산의 날씨 카드만 만들었습니다. 이후 출발 도시와 시간을 받고,
          이동 가능한 도시의 도착 예보를 비교하도록 바꿨습니다. 마지막에는 활동별 장소, 실제 경로,
          건물 그림자와 출발 시간 비교를 한 화면에 연결했습니다.
        </p>
      </div>
    </section>

    <section class="learning-section" aria-labelledby="learning-title">
      <h2 id="learning-title">수업 내용 적용</h2>
      <div class="learning-list">
        <article v-for="lesson in lessons" :key="lesson.pages">
          <span>{{ lesson.pages }}</span>
          <strong>{{ lesson.topic }}</strong>
          <p>{{ lesson.use }}</p>
        </article>
      </div>
    </section>

    <section class="troubleshooting-section" aria-labelledby="troubleshooting-title">
      <h2 id="troubleshooting-title">트러블 슈팅</h2>
      <div class="troubleshooting-list">
        <article v-for="item in troubleshooting" :key="item.problem">
          <strong>{{ item.problem }}</strong>
          <dl>
            <div>
              <dt>원인</dt>
              <dd>{{ item.cause }}</dd>
            </div>
            <div>
              <dt>수정</dt>
              <dd>{{ item.fix }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <section class="result-section" aria-labelledby="result-title">
      <h2 id="result-title">최종 구현 내용</h2>
      <div>
        <h3>출발 조건부터 도착지 선택까지 한 흐름으로 구현했습니다.</h3>
        <ul>
          <li>18개 도시의 OpenWeather 도착 예보와 활동별 장소를 비교합니다.</li>
          <li>이동 시간 안의 전체 후보와 OSRM 경로를 확인하고 원하는 도시로 바꿀 수 있습니다.</li>
          <li>출발 시간을 바꿔 다시 추천하거나, 도착지 3D 건물과 그림자를 확인할 수 있습니다.</li>
          <li>144개 기상 지점의 비·흐림 상태와 외부 날씨 자료를 함께 비교할 수 있습니다.</li>
        </ul>
        <p class="result-note">
          지도 기상 지점은 비교용 모델값이며 기상 레이더가 아닙니다. 그늘 경로도 도착지 주변의 지도
          건물과 자동차 경로 대안을 비교한 참고 결과입니다.
        </p>
      </div>
    </section>
  </article>
</template>

<style scoped>
.process-view {
  width: 100%;
  max-width: 860px;
  padding-top: 58px;
  margin: 0 auto;
}

.page-intro {
  padding-bottom: 42px;
  border-bottom: 1px solid var(--ink);
}

.page-intro h1,
.page-intro p,
.reason-section p,
.reason-section h2,
.reason-section h3,
.learning-section h2,
.troubleshooting-section h2,
.result-section p,
.result-section h2,
.result-section h3 {
  margin: 0;
}

.page-intro h1 {
  max-width: 820px;
  font-size: clamp(42px, 7vw, 72px);
  line-height: 1.08;
  letter-spacing: -0.062em;
  word-break: keep-all;
}

.page-intro p {
  max-width: 640px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.7;
}

.reason-section,
.result-section {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 28px;
  padding: 34px 0;
  border-bottom: 1px solid var(--line-strong);
}

.reason-section > h2,
.result-section > h2 {
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.reason-section h3,
.result-section h3,
.learning-section > h2,
.troubleshooting-section > h2 {
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.04em;
}

.reason-section div > p {
  margin-top: 15px;
  color: var(--muted);
  line-height: 1.8;
}

.learning-section,
.troubleshooting-section {
  margin-top: 58px;
}

.learning-list,
.troubleshooting-list {
  margin-top: 20px;
  border-top: 1px solid var(--line-strong);
}

.learning-list article {
  display: grid;
  grid-template-columns: 110px minmax(180px, 0.8fr) 1.6fr;
  gap: 22px;
  align-items: start;
  padding: 21px 0;
  border-bottom: 1px solid var(--line);
}

.learning-list span {
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
}

.learning-list p,
.troubleshooting-list dd,
.result-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.troubleshooting-list article {
  display: grid;
  grid-template-columns: minmax(220px, 0.75fr) 1.25fr;
  gap: 28px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}

.troubleshooting-list dl,
.troubleshooting-list dd {
  margin: 0;
}

.troubleshooting-list dl {
  display: grid;
  gap: 9px;
}

.troubleshooting-list dl div {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 8px;
}

.troubleshooting-list dt {
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
}

.result-section {
  margin-top: 58px;
  border-top: 1px solid var(--ink);
}

.result-section ul {
  padding: 0;
  margin: 20px 0 0;
  list-style: none;
}

.result-section li {
  padding: 11px 0 11px 20px;
  border-top: 1px solid var(--line);
  line-height: 1.6;
}

.result-section li::before {
  content: '—';
  margin-left: -20px;
  margin-right: 9px;
  color: var(--accent);
}

.result-note {
  margin-top: 18px !important;
  font-size: 13px;
}

@media (max-width: 760px) {
  .process-view {
    padding-top: 38px;
  }

  .reason-section,
  .result-section,
  .learning-list article,
  .troubleshooting-list article {
    grid-template-columns: 1fr;
  }

  .reason-section,
  .result-section {
    gap: 12px;
  }

  .learning-list article,
  .troubleshooting-list article {
    gap: 8px;
  }
}
</style>
