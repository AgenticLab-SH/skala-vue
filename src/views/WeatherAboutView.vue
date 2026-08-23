<script setup>
const lessons = [
  {
    pages: '126·144쪽',
    topic: '반응형 상태와 계산 속성',
    use: '출발 조건과 API 상태는 ref로 관리하고, 선택한 도시와 추천 결과는 computed로 계산했습니다.',
  },
  {
    pages: '146~178쪽',
    topic: '컴포넌트, Props·Emits, Slot',
    use: '입력 폼, 추천 결과, 후보 목록, 시간 비교와 경로 지도를 컴포넌트로 나눠 연결했습니다.',
  },
  {
    pages: '179~197쪽',
    topic: 'Vue Router',
    use: '이동 추천, 도시별 날씨, 상세 화면, 구현 기록과 수업 실습 기록을 경로로 분리했습니다.',
  },
  {
    pages: '198~212쪽',
    topic: 'Pinia',
    use: '온도 단위, 관심 도시, 마지막 출발 조건과 날씨 효과 설정을 화면 사이에서 유지했습니다.',
  },
  {
    pages: '213~230쪽',
    topic: 'Axios',
    use: 'OpenWeather 동기화와 날씨 파일 조회, 경로 API 요청을 Axios로 분리하고 응답을 화면에서 쓰는 형태로 정리했습니다.',
  },
  {
    pages: '231~249쪽',
    topic: 'UI 라이브러리',
    use: 'Element Plus는 필요한 폼·입력·알림 컴포넌트만 등록해 실습과 서비스 화면에 적용했습니다.',
  },
  {
    pages: '250~274쪽',
    topic: 'Vite 빌드와 배포',
    use: 'ESLint와 Prettier로 점검하고 환경별 빌드와 GitHub Pages 배포를 확인했습니다.',
  },
]

const decisions = [
  {
    title: '날씨 카드에서 실제 계획으로 넓혔습니다.',
    detail:
      '처음에는 도시 날씨를 모아 보는 화면이었습니다. 날씨를 확인한 다음 무엇을 할지 다시 고민해야 한다는 점이 남아, 출발 시간·이동 시간·활동을 함께 받는 추천으로 방향을 바꿨습니다.',
  },
  {
    title: '활동마다 장소를 따로 골랐습니다.',
    detail:
      '러닝, 등산, 바다, 풋살, 자전거를 바꿔도 같은 관광지가 나오는 것을 직접 확인했습니다. 도시별 활동 장소와 적합도를 분리하고, 해당 활동을 할 수 없는 도시는 비교에서 제외했습니다.',
  },
  {
    title: '멀리 가는 경우와 동네에서 움직이는 경우를 함께 다뤘습니다.',
    detail:
      '출발 도시도 후보에 남기고 최대 이동 시간을 30분부터 5시간까지 늘렸습니다. 같은 도시에서는 시청·도청·군청에서 실제 활동 장소까지 경로를 계산해 지역 안의 이동도 보이게 했습니다.',
  },
  {
    title: '그늘길의 아이디어를 도착지 선택 뒤까지 연결했습니다.',
    detail:
      '참고 화면처럼 시간과 건물 높이로 그림자를 표시하고, 여기에서 멈추지 않고 빠른 경로와 그늘이 더 많은 경로를 비교했습니다. 지도는 상단·3D 전환뿐 아니라 회전과 기울기도 직접 조절할 수 있게 했습니다.',
  },
  {
    title: '실제로 눌러 보며 설명과 조작을 줄였습니다.',
    detail:
      '점수·건물 수·API 갱신 시각처럼 선택에 필요하지 않은 정보는 덜어냈습니다. 빠른 설정, 앞뒤 시간 비교, 외부 날씨 확인, 탐색 애니메이션은 무엇을 누르면 되는지 바로 보이도록 순서를 다시 잡았습니다.',
  },
]

const troubleshooting = [
  {
    problem: '추천 버튼을 눌러도 탐색 중이라는 점이 잘 보이지 않았습니다.',
    cause:
      '요청이 빠르게 끝나거나 애니메이션이 현재 화면 아래에서 나타났고, 첫 접속 자동 조회도 같은 화면을 사용했습니다. 플레이어가 준비됐다는 신호와 파일 재생이 끝났다는 신호도 처음에는 구분하지 못했습니다.',
    fix: '첫 접속에는 탐색 레이어를 숨기고 추천을 직접 요청했을 때만 나타나게 했습니다. 파일 로드 뒤 재생을 시작하고 완료 신호를 기다리도록 바꾼 뒤, 약 1.6초에 한 사이클이 끝나게 속도를 조정했습니다. 실제 비교 작업과 모션이 모두 끝났을 때 바로 결과로 넘어갑니다.',
  },
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
    fix: '그림자 면과 외곽선의 대비를 높이고 지도 각도를 직접 돌려 확인할 수 있는 나침반 조작을 추가했습니다.',
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
  {
    problem: '추천 점수와 API 출처가 결과보다 먼저 눈에 들어왔습니다.',
    cause: '개발 중 확인하던 숫자와 출처 문구를 그대로 화면에 남겼습니다.',
    fix: '내부 점수·건물 수·중복 출처는 빼고 도착 날씨와 활동 장소처럼 선택에 필요한 정보만 남겼습니다.',
  },
  {
    problem: '출발 시간 비교가 늦게 출발하는 경우만 보여 줬습니다.',
    cause: '처음에는 현재·3시간 뒤·6시간 뒤 세 경우만 계산했습니다.',
    fix: '기준 시각보다 1·2·3시간 빠른 경우와 1·2·3시간 늦은 경우를 모두 비교하도록 바꿨습니다.',
  },
  {
    problem: '같은 도시를 선택하면 출발지와 도착지가 같은 점으로 표시됐습니다.',
    cause: '도시 대표 좌표 하나를 출발과 도착에 함께 사용했습니다.',
    fix: '출발은 시청·도청·군청 좌표로 두고, 도착은 선택한 활동 장소 좌표를 사용해 지역 안의 경로도 계산했습니다.',
  },
  {
    problem: '빠른 설정 카드의 분위기 문구가 실제 동작을 설명하지 못했습니다.',
    cause: '시간대를 구분하려고 넣은 말이 버튼의 목적보다 먼저 보였습니다.',
    fix: '장식적인 문구를 없애고 도시·출발 시각·이동 시간만 남겨 예시 조건을 바로 읽게 했습니다.',
  },
  {
    problem: '비와 구름 효과가 지역보다 크게 보여 실제 위치를 알기 어려웠습니다.',
    cause: '넓은 화면 장식으로 먼저 만들면서 기상 지점과 효과의 크기가 맞지 않았습니다.',
    fix: '전국 48개 기준 지역을 144개 지점으로 나누고, 지도 배율에 따라 작은 비와 구름이 각 좌표를 따라가게 바꿨습니다.',
  },
  {
    problem: '외부 날씨 비교 영역이 눌리는 곳처럼 보이지 않았습니다.',
    cause: '접힌 제목만 두어 다음에 무엇이 열리는지 알기 어려웠습니다.',
    fix: '패널 전체를 누를 수 있게 하고 기상청 지도와 네이버 날씨가 열린다는 문구, 열림 상태와 포커스 표시를 함께 넣었습니다.',
  },
  {
    problem: '환영 화면이 한 번만 나오거나 너무 오래 머물렀습니다.',
    cause: '탭별 방문 여부를 저장했고 애니메이션 완료 시점에만 닫히도록 두었습니다.',
    fix: '접속과 새로고침마다 표시하고, 약 1.6초로 조정한 모션의 마지막 장면이 그려진 뒤 닫도록 바꿨습니다. 그동안 첫 날씨 요청을 시작하되 지도 탐색 레이어는 띄우지 않고, 종료 뒤 본문으로 포커스를 돌렸습니다.',
  },
  {
    problem: '예보에 `온흐림`, `튼구름`, `실 비`처럼 어색한 표현이 보였습니다.',
    cause: 'OpenWeather가 반환한 한국어 설명을 사용자 문구로 그대로 표시했습니다.',
    fix: '예보를 저장할 때와 화면에서 읽을 때 모두 날씨 표현을 `흐림`, `구름 많음`, `약한 비`로 정리했습니다.',
  },
  {
    problem: '전국 날씨가 0곳이 되고 지도 위 비와 구름도 사라졌습니다.',
    cause: '전국 지점용 Open-Meteo 요청이 한꺼번에 실행되면서 공개 API의 호출 제한에 걸렸습니다.',
    fix: '배포 때 갱신하는 OpenWeather 현재값을 가까운 지도 표시 지점에 연결했습니다. 추천과 전국 지도가 같은 파일을 사용해 방문자 수와 외부 호출 제한에 따라 지도가 비지 않게 했습니다.',
  },
]
</script>

<template>
  <article class="process-view">
    <header class="page-intro">
      <h1>이동보다 어디로 갈지 정하는 일이 더 어렵다고 느꼈습니다.</h1>
      <p>날씨와 이동 시간을 함께 비교해 활동할 장소를 고를 수 있도록 만들었습니다.</p>
    </header>

    <section class="reason-section" aria-labelledby="reason-title">
      <h2 id="reason-title">구현 이유와 과정</h2>
      <div>
        <h3>이동 자체보다 어디로 갈지 고민하는 과정에서 시작했습니다.</h3>
        <p>
          이동하는 일은 어렵지 않지만, 날씨까지 확인하며 어디로 갈지 정하는 과정은 번거롭다고
          느꼈습니다. 그늘길이 시간과 건물 그림자를 이용해 걷기 편한 길을 보여 주는 점을 보고,
          날씨도 출발 시간과 활동 장소를 정하는 기준으로 사용할 수 있겠다고 생각했습니다.
        </p>
        <p>
          처음에는 서울·수원·창원·부산의 날씨 카드만 만들었습니다. 이후 출발 도시와 시간을 받고,
          이동 가능한 도시의 도착 예보를 비교하도록 바꿨습니다. 화면을 직접 눌러 보면서 활동별 장소,
          지역 안의 시청 출발 경로, 건물 그림자, 앞뒤 출발 시간 비교를 차례로 보완했습니다.
        </p>
        <ol class="decision-list">
          <li v-for="(decision, index) in decisions" :key="decision.title">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ decision.title }}</strong>
              <p>{{ decision.detail }}</p>
            </div>
          </li>
        </ol>
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
        <h3>출발 조건부터 장소 선택까지 한 흐름으로 구현했습니다.</h3>
        <ul>
          <li>18개 도시의 OpenWeather 도착 예보와 활동별 장소를 비교합니다.</li>
          <li>이동 시간 안의 전체 후보와 OSRM 경로를 확인하고 원하는 도시로 바꿀 수 있습니다.</li>
          <li>
            앞뒤 출발 시간을 비교하거나, 선택한 장소 주변의 3D 건물과 그림자를 확인할 수 있습니다.
          </li>
          <li>144개 기상 지점의 비·흐림 상태와 외부 날씨 자료를 함께 비교할 수 있습니다.</li>
        </ul>
        <p class="result-note">
          지도 기상 지점은 비교용 모델값이며 기상 레이더가 아닙니다. 그늘 경로도 선택 지역 주변의
          지도 건물과 자동차 경로 대안을 비교한 참고 결과입니다.
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

.decision-list {
  padding: 0;
  margin: 30px 0 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.decision-list li {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.decision-list li > span {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.decision-list strong {
  display: block;
  line-height: 1.5;
}

.decision-list li p {
  margin-top: 7px;
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
