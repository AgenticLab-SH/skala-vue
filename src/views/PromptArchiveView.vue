<script setup>
const promptGroups = [
  {
    id: 'vue-structure',
    title: 'Vue 상태와 화면 구성',
    prompts: [
      {
        text: '출발 도시, 출발 시각, 최대 이동 시간, 선택한 활동은 ref로 관리해. 조건이 바뀔 때마다 화면에 바로 반영하고, 추천 후보와 대표 결과는 computed로 정리해.',
        applied: ['ref', 'computed'],
      },
      {
        text: '입력 폼, 추천 결과, 후보 목록, 출발 시간 비교, 경로 지도를 컴포넌트로 분리해. 부모는 상태를 관리하고 자식은 props와 emits로 필요한 값만 주고받게 해.',
        applied: ['컴포넌트', 'Props·Emits'],
      },
      {
        text: '이동 추천, 도시별 날씨, 구현 기록, 수업 실습 기록, 활용자료를 Vue Router 경로로 나눠. 온도 단위와 마지막 출발 조건은 Pinia에 저장해서 화면을 이동해도 유지해.',
        applied: ['Vue Router', 'Pinia'],
      },
    ],
  },
  {
    id: 'service-direction',
    title: '서비스 방향 구체화',
    prompts: [
      {
        text: '현재 날씨 카드만 보여 주지 말고, 출발 시간에 도착지 날씨가 어떤지 비교해서 활동하기 괜찮은 곳을 추천하는 서비스로 확장해.',
        applied: ['도착 예보', '이동 추천'],
      },
      {
        text: '비나 구름을 피해 이동할 수 있는 곳을 찾는 아이디어를 적용해. 출발지와 이동 시간을 입력하면 그 안에서 날씨가 더 나은 지역을 고를 수 있게 해.',
        applied: ['날씨 비교', '이동 범위'],
      },
    ],
  },
  {
    id: 'recommendation',
    title: '활동과 추천 로직',
    prompts: [
      {
        text: '러닝, 등산, 바다, 풋살, 자전거를 선택했을 때 같은 관광지가 반복되지 않게 해. 도시별로 실제 활동에 맞는 장소를 나누고, 해당 활동을 할 수 없는 도시는 후보에서 제외해.',
        applied: ['활동별 장소', '후보 필터'],
      },
      {
        text: '서울에서 출발해도 서울을 후보에서 빼지 마. 다른 도시도 같은 방식으로 출발 지역을 포함하고, 같은 지역을 고르면 시청·도청·군청에서 활동 장소까지 이동하는 경로를 계산해.',
        applied: ['지역 내 이동', '행정청사 출발'],
      },
      {
        text: '최대 이동 시간은 30분, 1시간, 2시간, 3시간, 4시간, 5시간으로 선택하게 해. 이동 시간 안의 전체 후보를 대표 추천 옆에서 바로 바꿔 볼 수 있게 표시해.',
        applied: ['시간 필터', '전체 후보'],
      },
    ],
  },
  {
    id: 'map-route',
    title: '지도와 경로',
    prompts: [
      {
        text: '시간과 건물 높이로 그림자를 표시하는 그늘길 아이디어를 적용해. 도착 시각의 태양 고도와 방위로 건물 그림자를 계산하고, 빠른 경로와 그늘이 더 많은 경로를 비교해.',
        applied: ['SunCalc', '그늘 경로'],
      },
      {
        text: 'OSRM 경로를 MapLibre 지도에 표시하고 목적지 주변 건물은 3D로 보여 줘. 상단 보기와 3D 보기뿐 아니라 나침반 회전과 기울기도 직접 조절할 수 있게 해.',
        applied: ['OSRM', 'MapLibre 3D'],
      },
      {
        text: '홈을 출발 조건, 추천 결과, 이동 경로, 시간 변경 네 구간으로 나눠. 이동 경로까지 스크롤하면 대한민국 전체 지도에서 목적지 3D 건물과 그림자까지 빠르게 확대되게 해.',
        applied: ['스크롤 단계', 'MapLibre 카메라'],
      },
      {
        text: '지도에 전체보기와 확대보기를 함께 두고, 마우스로 드래그하거나 모바일에서 터치와 핀치로 직접 움직일 수 있게 해. 모바일은 페이지 스크롤로 바로 돌아갈 수 있어야 해.',
        applied: ['지도 직접 조작', '터치 전환'],
      },
    ],
  },
  {
    id: 'weather-data',
    title: '날씨 데이터와 모션',
    prompts: [
      {
        text: 'OpenWeather API로 현재 날씨와 5일 예보를 받아. API 키는 소스에 넣지 말고 환경 변수와 GitHub Actions Secret으로 관리해.',
        applied: ['OpenWeather', '환경 변수'],
      },
      {
        text: '전국 날씨를 큰 권역 하나로 뭉치지 말고 세부 지점으로 나눠 지도에 표시해. 추천과 전국 지도가 같은 OpenWeather 데이터를 사용해서 공개 API 호출 제한으로 지도가 비지 않게 해.',
        applied: ['144개 기상 지점', '배포 스냅샷'],
      },
      {
        text: '비가 오는 지점에는 작은 빗줄기, 흐린 지점에는 작은 구름 모션을 지도 좌표에 맞춰 표시해. 지도 위 토글로 날씨 모션을 끄고 켤 수 있게 하고 처음에는 켜 둬.',
        applied: ['지도 날씨 모션', '토글'],
      },
      {
        text: '선택한 출발 도시의 맑음, 흐림, 비, 눈, 안개 상태를 페이지 배경에 확실하게 보여 줘. 효과는 입력 카드와 글을 덮지 않도록 콘텐츠 뒤의 배경 계층에서만 움직이게 해.',
        applied: ['배경 효과', '접근성'],
      },
    ],
  },
  {
    id: 'user-flow',
    title: '빠른 사용과 비교 흐름',
    prompts: [
      {
        text: '서울 내일 오전 10시·2시간, 창원 내일 오후 1시·3시간, 광주 내일 오후 7시·4시간 예시를 만들어. 누르면 조건을 채우고 활동 선택 영역으로 스크롤한 뒤 포커스를 옮겨.',
        applied: ['빠른 설정', '포커스 이동'],
      },
      {
        text: '선택한 출발 시각을 기준으로 1·2·3시간 빠른 경우와 1·2·3시간 늦은 경우를 한 시간 간격으로 비교해. 시간 카드를 누르면 그 시각으로 추천을 다시 실행해.',
        applied: ['시간대 비교', '재추천'],
      },
      {
        text: '외부 날씨 비교와 접힌 패널은 누를 수 있다는 점이 바로 보이게 해. 패널 전체에 포커스와 열림 상태를 표시하고, 필요한 설명만 남겨.',
        applied: ['상태 표시', '키보드 조작'],
      },
    ],
  },
  {
    id: 'visual-motion',
    title: '화면과 상태 애니메이션',
    prompts: [
      {
        text: '색 막대와 겹친 카드를 줄이고 수업에서 만든 화면 구조를 중심으로 정리해. 리퀴드 글래스는 헤더와 상태 레이어처럼 필요한 곳에만 적용해.',
        applied: ['화면 정리', '리퀴드 글래스'],
      },
      {
        text: '접속하거나 새로고침하면 웰컴 애니메이션을 한 번 보여 줘. 약 2초 안에 마지막 장면까지 보이게 하고, 그동안 첫 날씨 데이터를 미리 불러와.',
        applied: ['웰컴 상태', '데이터 선로딩'],
      },
      {
        text: '추천 확인하기를 누르면 현재 화면 위에 투명한 유리 레이어로 지도 탐색 애니메이션을 보여 줘. 요청이 빨리 끝나도 최소 1초는 재생하고, 작업이 더 길면 완료될 때까지 마지막 장면을 유지해.',
        applied: ['탐색 상태', '비동기 동기화'],
      },
      {
        text: '첫 접속 웰컴 화면과 지도 탐색 화면이 동시에 뜨지 않게 해. 자동 조회에는 탐색 레이어를 숨기고 사용자가 직접 추천을 요청했을 때만 표시해.',
        applied: ['상태 분리', '중복 방지'],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: '오류 수정과 문구 정리',
    prompts: [
      {
        text: 'API가 반환한 `온흐림`, `튼구름`, `실 비` 같은 표현을 그대로 쓰지 마. 화면에 표시하기 전에 `흐림`, `구름 많음`, `약한 비`처럼 자연스러운 한국어로 정리해.',
        applied: ['날씨 문구 정규화'],
      },
      {
        text: '전국 날씨가 0곳으로 나오고 비·구름 모션이 사라지는 원인을 확인해. 일부 요청이 실패해도 기존 추천과 확인된 날씨는 남기고, 다시 불러올 수 있는 상태를 보여 줘.',
        applied: ['부분 실패', '오류 복구'],
      },
    ],
  },
]

const promptCount = promptGroups.reduce((total, group) => total + group.prompts.length, 0)
</script>

<template>
  <article class="prompt-view">
    <header class="page-intro">
      <span>사용한 프롬프트</span>
      <h1>기능을 구체화하며 사용한 요청을 정리했습니다.</h1>
      <p>
        같은 내용을 반복해서 수정한 요청은 하나로 합치고, 실제 구현 방향을 바꾼 내용만 남겼습니다.
      </p>
      <dl class="summary-counts" aria-label="프롬프트 정리 개수">
        <div>
          <dt>주제</dt>
          <dd>{{ promptGroups.length }}개</dd>
        </div>
        <div>
          <dt>프롬프트</dt>
          <dd>{{ promptCount }}개</dd>
        </div>
      </dl>
    </header>

    <nav class="prompt-index" aria-label="프롬프트 주제">
      <RouterLink
        v-for="group in promptGroups"
        :key="group.id"
        :to="{ path: '/prompts', hash: `#${group.id}` }"
      >
        {{ group.title }}
      </RouterLink>
    </nav>

    <div class="prompt-sections">
      <section
        v-for="(group, groupIndex) in promptGroups"
        :id="group.id"
        :key="group.id"
        class="prompt-section"
      >
        <header>
          <span>{{ String(groupIndex + 1).padStart(2, '0') }}</span>
          <h2>{{ group.title }}</h2>
        </header>

        <ol class="prompt-list">
          <li v-for="(prompt, promptIndex) in group.prompts" :key="prompt.text">
            <span class="prompt-number">{{ promptIndex + 1 }}</span>
            <div>
              <p>{{ prompt.text }}</p>
              <ul aria-label="적용 항목">
                <li v-for="item in prompt.applied" :key="item">{{ item }}</li>
              </ul>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </article>
</template>

<style scoped>
.prompt-view {
  width: 100%;
  max-width: 920px;
  padding-top: 58px;
  margin: 0 auto;
}

.page-intro {
  padding-bottom: 34px;
  border-bottom: 1px solid var(--ink);
}

.page-intro > span {
  color: #1266bd;
  font-size: 13px;
  font-weight: 800;
}

.page-intro h1,
.page-intro p,
.summary-counts,
.summary-counts dd,
.prompt-section h2,
.prompt-list,
.prompt-list p,
.prompt-list ul {
  margin: 0;
}

.page-intro h1 {
  max-width: 780px;
  margin-top: 16px;
  font-size: clamp(40px, 6.4vw, 66px);
  line-height: 1.08;
  letter-spacing: -0.058em;
  word-break: keep-all;
}

.page-intro p {
  max-width: 650px;
  margin-top: 20px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.75;
}

.summary-counts {
  display: flex;
  gap: 28px;
  margin-top: 26px;
}

.summary-counts div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.summary-counts dt {
  color: var(--muted);
  font-size: 12px;
}

.summary-counts dd {
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
}

.prompt-index {
  position: sticky;
  z-index: 4;
  top: 92px;
  display: flex;
  overflow-x: auto;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line-strong);
  background: rgba(238, 242, 245, 0.92);
  backdrop-filter: blur(16px);
  scrollbar-width: none;
}

.prompt-index::-webkit-scrollbar {
  display: none;
}

.prompt-index a {
  display: inline-flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 13px;
  border-radius: 12px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.prompt-index a:hover,
.prompt-index a:focus-visible {
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink);
  outline: 2px solid rgba(18, 102, 189, 0.28);
  outline-offset: -2px;
}

.prompt-section {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 30px;
  padding: 42px 0;
  border-bottom: 1px solid var(--line-strong);
  scroll-margin-top: 156px;
}

.prompt-section > header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-section > header span {
  color: #1266bd;
  font-size: 12px;
  font-weight: 800;
}

.prompt-section h2 {
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: -0.035em;
  word-break: keep-all;
}

.prompt-list {
  padding: 0;
  list-style: none;
}

.prompt-list > li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  padding: 0 0 26px;
}

.prompt-list > li + li {
  padding-top: 26px;
  border-top: 1px solid var(--line);
}

.prompt-list > li:last-child {
  padding-bottom: 0;
}

.prompt-number {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.prompt-list p {
  color: var(--ink);
  font-size: 16px;
  font-weight: 650;
  line-height: 1.75;
  word-break: keep-all;
}

.prompt-list ul {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0;
  margin-top: 13px;
  list-style: none;
}

.prompt-list ul li {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 1040px) {
  .prompt-index {
    top: 142px;
  }

  .prompt-section {
    scroll-margin-top: 206px;
  }
}

@media (max-width: 680px) {
  .prompt-view {
    padding-top: 34px;
  }

  .page-intro h1 {
    font-size: clamp(36px, 12vw, 52px);
  }

  .prompt-index {
    top: 138px;
  }

  .prompt-section {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 34px 0;
    scroll-margin-top: 200px;
  }

  .prompt-section > header {
    flex-direction: row;
    align-items: baseline;
    gap: 14px;
  }

  .prompt-list p {
    font-size: 15px;
  }
}
</style>
