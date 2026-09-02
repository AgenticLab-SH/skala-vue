import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  copyShareSafeRouteText,
  createShareSafeRouteReview,
  createShareSafeRouteSnapshot,
} from '../src/utils/shareSafeRoute.js'

const syntheticRecommendation = {
  origin: {
    id: 'origin-internal-42',
    name: '합성 비밀 출발지',
    latitude: 37.5665,
    longitude: 126.978,
  },
  city: {
    id: 'destination-internal-77',
    name: '부산',
    region: '부산광역시',
    latitude: 35.1796,
    longitude: 129.0756,
  },
  routeDestination: {
    id: 'place-internal-99',
    name: '합성 비밀 장소',
    latitude: 35.1532,
    longitude: 129.1187,
  },
  route: {
    minutes: 87,
    distance: 123,
    source: 'OSRM 경로',
    geometry: [
      [126.978, 37.5665],
      [129.1187, 35.1532],
    ],
    rawResponse: 'synthetic-route-raw-secret',
  },
  bundle: {
    source: 'OpenWeather',
    fetchedAt: '2026-08-31T00:00:00.000Z',
    rawResponse: 'synthetic-weather-raw-secret',
  },
  weather: {
    condition: '맑음',
    time: '2026-08-31T03:27:00.000Z',
  },
  activityPlace: { name: '합성 비밀 장소', internalId: 'place-internal-99' },
  arrivalAt: '2026-08-31T03:27:00.000Z',
  searchQuery: '합성 비밀 검색어',
  apiKey: 'synthetic-api-key-secret',
  score: 91,
}

test('공유 검토본은 도시 단위 공개 정보와 대략값만 허용한다', () => {
  const review = createShareSafeRouteReview(syntheticRecommendation, {
    activityLabel: '러닝',
    now: new Date('2026-08-31T02:00:00.000Z'),
  })

  assert.deepEqual(Object.keys(review), [
    'schemaVersion',
    'summary',
    'included',
    'excluded',
    'accuracy',
    'freshness',
    'sensitivity',
    'requiresHumanReview',
  ])
  assert.match(review.summary, /부산/)
  assert.match(review.summary, /러닝/)
  assert.match(review.summary, /약 1시간 30분/)
  assert.match(review.summary, /맑음/)
  assert.equal(review.accuracy.label, '경로 API 기반 참고값')
  assert.equal(review.freshness.label, '6시간 이내 갱신')
  assert.equal(review.sensitivity.label, '보통')
  assert.equal(review.requiresHumanReview, true)

  const serialized = JSON.stringify(review)
  for (const secret of [
    '합성 비밀 출발지',
    '합성 비밀 장소',
    '합성 비밀 검색어',
    'origin-internal-42',
    'destination-internal-77',
    'place-internal-99',
    'synthetic-api-key-secret',
    'synthetic-route-raw-secret',
    'synthetic-weather-raw-secret',
    '126.978',
    '129.1187',
    '2026-08-31T03:27:00.000Z',
    '91',
  ]) {
    assert.doesNotMatch(serialized, new RegExp(secret.replaceAll('.', '\\.')))
  }
})

test('추정 경로와 시각 미확인은 과장 없이 표시한다', () => {
  const review = createShareSafeRouteReview(
    {
      city: { name: '합성 도시' },
      route: { minutes: 21, source: '직선거리 기반 추정' },
      bundle: {},
      weather: { condition: '흐림' },
    },
    { activityLabel: '산책', now: new Date('2026-08-31T02:00:00.000Z') },
  )

  assert.equal(review.accuracy.label, '직선거리 기반 추정')
  assert.equal(review.freshness.label, '갱신 시각 미확인')
  assert.match(review.accuracy.caveat, /실제 이동과 다를 수/)
})

test('공유 UI는 검토 전 잠기고 외부 전송 API를 호출하지 않는다', () => {
  const component = readFileSync(
    new URL('../src/components/planner/ShareSafeReview.vue', import.meta.url),
    'utf8',
  )

  assert.match(component, /:disabled="!isReviewCurrent \|\| copyStatus === 'pending'"/)
  assert.match(component, /copyShareSafeRouteText/)
  assert.match(component, /reviewSnapshot/)
  assert.match(component, /Web Share나 네트워크 전송은 하지 않습니다/)
  assert.doesNotMatch(component, /navigator\.share/)
})

test('검토 전 취소는 clipboard writer를 호출하지 않는다', async () => {
  let callCount = 0
  await assert.rejects(
    copyShareSafeRouteText(syntheticRecommendation, {
      activityLabel: '러닝',
      reviewed: false,
      writeText: async () => {
        callCount += 1
      },
    }),
    { code: 'REVIEW_REQUIRED' },
  )
  assert.equal(callCount, 0)
})

test('clipboard API 부재는 fail-closed한다', async () => {
  const reviewedSnapshot = createShareSafeRouteSnapshot(syntheticRecommendation, {
    activityLabel: '러닝',
  })
  await assert.rejects(
    copyShareSafeRouteText(syntheticRecommendation, {
      activityLabel: '러닝',
      reviewed: true,
      reviewedSnapshot,
    }),
    { code: 'CLIPBOARD_UNAVAILABLE' },
  )
})

test('권한 거부와 사용자 취소는 성공으로 처리하지 않는다', async () => {
  const reviewedSnapshot = createShareSafeRouteSnapshot(syntheticRecommendation, {
    activityLabel: '러닝',
  })
  for (const name of ['NotAllowedError', 'AbortError']) {
    await assert.rejects(
      copyShareSafeRouteText(syntheticRecommendation, {
        activityLabel: '러닝',
        reviewed: true,
        reviewedSnapshot,
        writeText: async () => {
          throw new DOMException('synthetic clipboard refusal', name)
        },
      }),
      { code: 'CLIPBOARD_WRITE_FAILED' },
    )
  }
})

test('clipboard 인자는 허용목록으로 새로 만든 텍스트뿐이다', async () => {
  const clipboardArguments = []
  const now = new Date('2026-08-31T02:00:00.000Z')
  const reviewedSnapshot = createShareSafeRouteSnapshot(syntheticRecommendation, {
    activityLabel: '러닝',
    now,
  })
  const copiedText = await copyShareSafeRouteText(syntheticRecommendation, {
    activityLabel: '러닝',
    reviewed: true,
    reviewedSnapshot,
    now,
    writeText: async (...args) => clipboardArguments.push(args),
  })

  assert.deepEqual(clipboardArguments, [[copiedText]])
  assert.match(copiedText, /부산/)
  assert.match(copiedText, /약 1시간 30분/)
  for (const secret of [
    '합성 비밀 출발지',
    '합성 비밀 장소',
    '합성 비밀 검색어',
    'origin-internal-42',
    'destination-internal-77',
    'place-internal-99',
    'synthetic-api-key-secret',
    'synthetic-route-raw-secret',
    'synthetic-weather-raw-secret',
    '126.978',
    '129.1187',
    '2026-08-31T03:27:00.000Z',
    '91',
  ]) {
    assert.doesNotMatch(copiedText, new RegExp(secret.replaceAll('.', '\\.')))
  }
})

test('검토 뒤 목적지·활동·시간·날씨 변화는 복사를 즉시 잠근다', async () => {
  const now = new Date('2026-08-31T02:00:00.000Z')
  const reviewedSnapshot = createShareSafeRouteSnapshot(syntheticRecommendation, {
    activityLabel: '러닝',
    now,
  })
  const cases = [
    {
      label: '목적지',
      activityLabel: '러닝',
      mutate: (item) => {
        item.city.name = '합성 변경 도시'
      },
    },
    {
      label: '활동',
      activityLabel: '등산',
      mutate: () => {},
    },
    {
      label: '같은 표시 구간 안 시간',
      activityLabel: '러닝',
      mutate: (item) => {
        item.route.minutes = 88
        item.arrivalAt = '2026-08-31T03:28:00.000Z'
      },
    },
    {
      label: '날씨',
      activityLabel: '러닝',
      mutate: (item) => {
        item.weather.condition = '비'
      },
    },
  ]

  for (const scenario of cases) {
    const changed = structuredClone(syntheticRecommendation)
    scenario.mutate(changed)
    let callCount = 0
    await assert.rejects(
      copyShareSafeRouteText(changed, {
        activityLabel: scenario.activityLabel,
        reviewed: true,
        reviewedSnapshot,
        now,
        writeText: async () => {
          callCount += 1
        },
      }),
      { code: 'STALE_REVIEW' },
      scenario.label,
    )
    assert.equal(callCount, 0, scenario.label)
  }
})

test('민감 필드 변화도 stale 처리하고 재검토 뒤 clipboard에 노출하지 않는다', async () => {
  const now = new Date('2026-08-31T02:00:00.000Z')
  const reviewedSnapshot = createShareSafeRouteSnapshot(syntheticRecommendation, {
    activityLabel: '러닝',
    now,
  })
  const changed = structuredClone(syntheticRecommendation)
  changed.apiKey = 'rotated-sensitive-api-key'
  changed.route.rawResponse = 'changed-sensitive-route-raw'
  const clipboardArguments = []

  await assert.rejects(
    copyShareSafeRouteText(changed, {
      activityLabel: '러닝',
      reviewed: true,
      reviewedSnapshot,
      now,
      writeText: async (...args) => clipboardArguments.push(args),
    }),
    { code: 'STALE_REVIEW' },
  )
  assert.deepEqual(clipboardArguments, [])

  const refreshedSnapshot = createShareSafeRouteSnapshot(changed, { activityLabel: '러닝', now })
  await copyShareSafeRouteText(changed, {
    activityLabel: '러닝',
    reviewed: true,
    reviewedSnapshot: refreshedSnapshot,
    now,
    writeText: async (...args) => clipboardArguments.push(args),
  })
  assert.equal(clipboardArguments.length, 1)
  assert.doesNotMatch(clipboardArguments[0][0], /rotated-sensitive-api-key/)
  assert.doesNotMatch(clipboardArguments[0][0], /changed-sensitive-route-raw/)
})
