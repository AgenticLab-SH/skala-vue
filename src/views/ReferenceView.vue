<template>
  <article class="reference-view">
    <header>
      <p>레퍼런스</p>
      <h1>실시간 환경을 이동 선택에 연결한 사례를 참고했습니다.</h1>
    </header>

    <section aria-labelledby="reference-title">
      <div>
        <span>01</span>
        <h2 id="reference-title">그늘길</h2>
      </div>
      <p>
        시간과 건물 정보를 지도에 겹쳐 이동 경로를 고르게 하는 문제 설정을 참고했습니다. 구름사이는
        화면이나 코드를 가져오지 않고, 도착 시각의 날씨와 활동 장소를 비교하는 방식으로 다시
        설계했습니다.
      </p>
      <a href="https://project-g-seven.vercel.app/" target="_blank" rel="noopener noreferrer">
        레퍼런스 사이트 열기 <span aria-hidden="true">↗</span>
      </a>
    </section>
  </article>
</template>

<style scoped>
.reference-view {
  width: 100%;
  max-width: 820px;
  padding-top: 64px;
  margin: 0 auto;
}

header {
  padding-bottom: 34px;
  border-bottom: 1px solid var(--ink);
}

header p,
header h1,
section p {
  margin: 0;
}

header > p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

h1 {
  margin-top: 12px !important;
  font-size: clamp(38px, 6vw, 62px);
  line-height: 1.08;
  letter-spacing: -0.055em;
  word-break: keep-all;
}

section {
  padding: 30px 0;
  border-bottom: 1px solid var(--line-strong);
}

section > div {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

section span,
section p {
  color: var(--muted);
}

h2 {
  margin: 0;
  font-size: 24px;
}

section p {
  max-width: 680px;
  margin-top: 16px;
  line-height: 1.75;
}

section > a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  border-bottom: 1px solid var(--ink);
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 680px) {
  .reference-view {
    padding-top: 38px;
  }
}
</style>
