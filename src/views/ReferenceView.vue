<script setup>
const resources = [
  {
    name: 'OpenWeather',
    type: '날씨 API',
    use: '18개 도시의 현재 날씨와 5일 예보를 배포 단계에서 받아 도착 시각과 가까운 예보를 찾았습니다.',
    href: 'https://openweathermap.org/api',
  },
  {
    name: 'Open-Meteo',
    type: '기상 데이터',
    use: '전국 144개 기상 지점의 강수량과 운량을 비교하고, OpenWeather 예보 파일이 없을 때 대체값으로 사용했습니다.',
    href: 'https://open-meteo.com/en/docs',
  },
  {
    name: 'OSRM',
    type: '경로 API',
    use: '출발지와 목적지 사이의 자동차 이동 시간, 거리, 경로 좌표와 경로 대안을 요청했습니다.',
    href: 'https://project-osrm.org/docs/v5.24.0/api/',
  },
  {
    name: 'OpenStreetMap Nominatim',
    type: '장소 좌표 확인',
    use: '활동 장소 이름으로 좌표를 한 번 확인해 정적 데이터로 저장했습니다. 화면을 사용할 때 Nominatim에 반복 요청하지 않습니다.',
    href: 'https://nominatim.org/release-docs/latest/api/Search/',
  },
  {
    name: 'MapLibre GL JS · OpenFreeMap',
    type: '지도·건물 데이터',
    use: '이동선, 기상 지점, 3D 건물과 계산한 건물 그림자를 지도에 표시했습니다.',
    href: 'https://maplibre.org/maplibre-gl-js/docs/',
  },
  {
    name: 'SunCalc · SunriseSunset.io',
    type: '태양 위치·일출 정보',
    use: '도착 시각의 태양 고도와 방향을 계산해 건물 그림자를 만들고, 상세 화면의 일출·일몰을 표시했습니다.',
    href: 'https://github.com/mourner/suncalc',
  },
  {
    name: '기상청 · 네이버 날씨',
    type: '외부 검증 자료',
    use: '사이트가 계산한 기상 지점과 실제 날씨 화면을 사용자가 직접 비교할 수 있도록 링크를 연결했습니다.',
    href: 'https://www.weather.go.kr/',
  },
  {
    name: 'Element Plus',
    type: 'Vue UI 라이브러리',
    use: '수업 실습의 폼 검증, 알림, 진행률과 서비스 검색 화면에 필요한 컴포넌트만 등록했습니다.',
    href: 'https://element-plus.org/',
  },
  {
    name: 'dotLottie Web',
    type: '애니메이션 런타임',
    use: 'LottieFiles 애니메이션을 Vue 컴포넌트의 Canvas로 재생하고, 컴포넌트가 사라질 때 재생 인스턴스를 정리했습니다.',
    href: 'https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/',
  },
  {
    name: 'Map Animation · Hiếu Phan Trung',
    type: 'LottieFiles 애니메이션',
    use: '날씨와 이동 경로를 비교하는 동안 현재 진행 상태를 보여 주는 용도로 사용했습니다.',
    href: 'https://lottiefiles.com/free-animation/splash-oOdsOknPhV',
  },
  {
    name: 'Wellcome Animation · Muneeb Ullah',
    type: 'LottieFiles 애니메이션',
    use: '사이트에 들어오거나 새로고침할 때 2초 동안 나타나는 환영 화면에 사용했습니다.',
    href: 'https://lottiefiles.com/free-animation/wellcome-animation-9cXI8Bc0SU',
  },
]
</script>

<template>
  <article class="reference-view">
    <header>
      <p>활용자료</p>
      <h1>외부 자료를 사용한 위치와 범위를 정리했습니다.</h1>
      <span>API 응답과 오픈소스 기능은 서비스 흐름에 맞게 다시 정리해 사용했습니다.</span>
    </header>

    <section class="runtime-section" aria-labelledby="runtime-title">
      <div>
        <p>현재 실행 환경</p>
        <h2 id="runtime-title">공개 배포에서 실제로 연결된 데이터</h2>
      </div>
      <dl>
        <div>
          <dt>도시 예보</dt>
          <dd>OpenWeather 18개 도시</dd>
        </div>
        <div>
          <dt>전국 기상 지도</dt>
          <dd>Open-Meteo 144개 지점</dd>
        </div>
        <div>
          <dt>이동 경로</dt>
          <dd>OSRM · 실패 시 거리 추정</dd>
        </div>
        <div>
          <dt>지도·건물</dt>
          <dd>MapLibre GL JS · OpenFreeMap</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="resource-title">
      <div class="section-title">
        <p>API·오픈소스·외부 지도</p>
        <h2 id="resource-title">가져와서 사용한 기능</h2>
      </div>
      <div class="resource-list">
        <article v-for="resource in resources" :key="resource.name">
          <div>
            <span>{{ resource.type }}</span>
            <h3>{{ resource.name }}</h3>
          </div>
          <p>{{ resource.use }}</p>
          <a :href="resource.href" target="_blank" rel="noopener noreferrer">
            공식 자료 보기 <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>
      <p class="license-note">
        두 애니메이션은 Lottie Simple License에 따라 사용했으며, 감소된 모션 설정에서는 자동 재생을
        멈춥니다.
        <a href="https://lottiefiles.com/page/license" target="_blank" rel="noopener noreferrer">
          라이선스 보기 <span aria-hidden="true">↗</span>
        </a>
      </p>
    </section>

    <section aria-labelledby="reference-title">
      <div class="section-title">
        <p>아이디어 참고</p>
        <h2 id="reference-title">그늘길</h2>
      </div>
      <div class="idea-reference">
        <p>
          시간과 건물 높이에 따라 지도 위 그림자가 달라지는 문제 설정을 참고했습니다. 화면이나
          코드를 가져오지는 않았습니다. 날씨의 요정에서는 도착 시각의 그림자를 3D 건물 아래에
          표시하고, OSRM 경로 대안의 그늘 비율과 추가 시간을 비교하는 기능으로 확장했습니다.
        </p>
        <a href="https://project-g-seven.vercel.app/" target="_blank" rel="noopener noreferrer">
          참고 사이트 열기 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  </article>
</template>

<style scoped>
.reference-view {
  width: 100%;
  max-width: 920px;
  padding-top: 58px;
  margin: 0 auto;
}

header {
  padding-bottom: 38px;
  border-bottom: 1px solid var(--ink);
}

header p,
header h1,
header span,
.section-title p,
.section-title h2,
.runtime-section p,
.runtime-section h2,
.resource-list h3,
.resource-list p,
.idea-reference p {
  margin: 0;
}

header > p,
.section-title p,
.runtime-section p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

h1 {
  max-width: 830px;
  margin-top: 12px !important;
  font-size: clamp(40px, 6vw, 66px);
  line-height: 1.08;
  letter-spacing: -0.057em;
  word-break: keep-all;
}

header > span {
  display: block;
  margin-top: 18px;
  color: var(--muted);
  line-height: 1.7;
}

.runtime-section {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 34px;
  padding: 30px;
  margin-top: 30px;
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.86);
}

.runtime-section h2,
.section-title h2 {
  margin-top: 7px;
  font-size: 25px;
  letter-spacing: -0.04em;
}

.runtime-section dl {
  margin: 0;
}

.runtime-section dl div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 9px 0;
  border-top: 1px solid var(--line);
}

.runtime-section dt {
  color: var(--muted);
}

.runtime-section dd {
  margin: 0;
  font-weight: 750;
  text-align: right;
}

section:not(.runtime-section) {
  margin-top: 58px;
}

.resource-list {
  margin-top: 20px;
  border-top: 1px solid var(--line-strong);
}

.license-note {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.license-note a {
  color: var(--accent);
  font-weight: 750;
}

.resource-list article {
  display: grid;
  grid-template-columns: minmax(170px, 0.7fr) 1.5fr auto;
  gap: 24px;
  align-items: center;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
}

.resource-list article > div span {
  color: var(--accent);
  font-size: 11px;
  font-weight: 800;
}

.resource-list h3 {
  margin-top: 5px;
  font-size: 18px;
}

.resource-list p,
.idea-reference p {
  color: var(--muted);
  line-height: 1.7;
}

.resource-list a,
.idea-reference a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid currentColor;
  color: var(--ink);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
  white-space: nowrap;
}

.idea-reference {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  align-items: end;
  padding: 24px 0 34px;
  border-bottom: 1px solid var(--line-strong);
}

@media (max-width: 760px) {
  .reference-view {
    padding-top: 38px;
  }

  .runtime-section,
  .resource-list article,
  .idea-reference {
    grid-template-columns: 1fr;
  }

  .runtime-section {
    padding: 22px 18px;
  }

  .resource-list article,
  .idea-reference {
    gap: 12px;
  }

  .resource-list a,
  .idea-reference a {
    justify-self: start;
  }
}
</style>
