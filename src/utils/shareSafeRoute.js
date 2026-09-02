const SIX_HOURS = 6 * 60 * 60 * 1000
const ONE_DAY = 24 * 60 * 60 * 1000

export class ShareSafeClipboardError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined)
    this.name = 'ShareSafeClipboardError'
    this.code = code
  }
}

function approximateTravelTime(minutes) {
  const safeMinutes = Number.isFinite(Number(minutes)) ? Math.max(0, Number(minutes)) : 0
  const roundedMinutes = Math.max(30, Math.round(safeMinutes / 30) * 30)
  const hours = Math.floor(roundedMinutes / 60)
  const rest = roundedMinutes % 60
  if (!hours) return `약 ${rest}분`
  return `약 ${hours}시간${rest ? ` ${rest}분` : ''}`
}

function describeAccuracy(source) {
  if (/OSRM|API/i.test(String(source ?? ''))) {
    return {
      label: '경로 API 기반 참고값',
      caveat: '자동차 경로 기준이며 실시간 교통과 현장 상황은 반영하지 않습니다.',
    }
  }
  return {
    label: '직선거리 기반 추정',
    caveat: '실제 이동과 다를 수 있으며 경로·소요 시간을 다시 확인해야 합니다.',
  }
}

function describeFreshness(fetchedAt, now) {
  const fetchedTime = new Date(fetchedAt).getTime()
  const currentTime = new Date(now).getTime()
  if (!Number.isFinite(fetchedTime) || !Number.isFinite(currentTime) || fetchedTime > currentTime) {
    return {
      label: '갱신 시각 미확인',
      caveat: '공유 전에 앱에서 현재 예보를 다시 확인해야 합니다.',
    }
  }
  const age = currentTime - fetchedTime
  if (age <= 60 * 60 * 1000) {
    return { label: '1시간 이내 갱신', caveat: '공유 뒤에도 날씨는 바뀔 수 있습니다.' }
  }
  if (age <= SIX_HOURS) {
    return { label: '6시간 이내 갱신', caveat: '출발 전에 최신 예보를 다시 확인해야 합니다.' }
  }
  if (age <= ONE_DAY) {
    return { label: '24시간 이내 갱신', caveat: '오래된 예보일 수 있어 재확인이 필요합니다.' }
  }
  return { label: '24시간 초과', caveat: '공유보다 먼저 예보를 새로 확인해야 합니다.' }
}

function stableSerialize(value, seen = new WeakSet()) {
  if (value === null) return 'null'
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? `date:${value.toISOString()}` : 'date:invalid'
  }

  const valueType = typeof value
  if (valueType === 'string' || valueType === 'boolean') return JSON.stringify(value)
  if (valueType === 'number') return Number.isFinite(value) ? String(value) : 'non-finite-number'
  if (valueType === 'bigint') return `bigint:${value}`
  if (valueType === 'undefined') return 'undefined'
  if (valueType === 'function') return 'function'
  if (valueType === 'symbol') return `symbol:${String(value.description ?? '')}`

  if (seen.has(value)) throw new ShareSafeClipboardError('SNAPSHOT_UNAVAILABLE')
  seen.add(value)
  const serialized = Array.isArray(value)
    ? `[${value.map((item) => stableSerialize(item, seen)).join(',')}]`
    : `{${Object.keys(value)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key], seen)}`)
        .join(',')}}`
  seen.delete(value)
  return serialized
}

function fingerprint(serialized) {
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= BigInt(serialized.charCodeAt(index))
    hash = BigInt.asUintN(64, hash * prime)
  }
  return hash.toString(16).padStart(16, '0')
}

export function createShareSafeRouteReview(recommendation, { activityLabel, now = new Date() }) {
  const destination = String(recommendation?.city?.name || '목적지 도시 미확인')
  const activity = String(activityLabel || '활동')
  const travelTime = approximateTravelTime(recommendation?.route?.minutes)
  const weather = String(recommendation?.weather?.condition || '날씨 미확인')

  return {
    schemaVersion: 1,
    summary: [
      '날씨의 요정 이동 추천',
      `활동: ${activity}`,
      `목적지 도시: ${destination}`,
      `예상 이동: ${travelTime}`,
      `도착 날씨: ${weather}`,
      '안내: 실제 경로·운영 여부·최신 예보는 출발 전에 다시 확인하세요.',
    ].join('\n'),
    included: ['활동 종류', '목적지 도시', '30분 단위 이동 시간', '도착 날씨', '정확도와 freshness'],
    excluded: [
      '출발지와 정확한 장소',
      '정확한 출발·도착 시각',
      '좌표와 전체 경로선',
      '검색어와 URL query',
      'API key와 내부 ID',
      '원문 응답과 내부 추천 점수',
    ],
    accuracy: describeAccuracy(recommendation?.route?.source),
    freshness: describeFreshness(recommendation?.bundle?.fetchedAt, now),
    sensitivity: {
      label: '보통',
      caveat: '목적지 도시와 활동은 포함됩니다. 공개 범위가 맞는지 직접 확인하세요.',
    },
    requiresHumanReview: true,
  }
}

export function createShareSafeRouteSnapshot(
  recommendation,
  { activityLabel, now = new Date() },
) {
  const review = createShareSafeRouteReview(recommendation, { activityLabel, now })
  const serialized = stableSerialize({ activityLabel, recommendation, review })
  return `route-review-v1-${fingerprint(serialized)}`
}

export async function copyShareSafeRouteText(
  recommendation,
  { activityLabel, reviewed, reviewedSnapshot, writeText, now = new Date() },
) {
  if (!reviewed) throw new ShareSafeClipboardError('REVIEW_REQUIRED')
  const currentSnapshot = createShareSafeRouteSnapshot(recommendation, { activityLabel, now })
  if (!reviewedSnapshot || reviewedSnapshot !== currentSnapshot) {
    throw new ShareSafeClipboardError('STALE_REVIEW')
  }
  if (typeof writeText !== 'function') {
    throw new ShareSafeClipboardError('CLIPBOARD_UNAVAILABLE')
  }

  const text = createShareSafeRouteReview(recommendation, { activityLabel, now }).summary
  try {
    await writeText(text)
  } catch (error) {
    if (error instanceof ShareSafeClipboardError) throw error
    throw new ShareSafeClipboardError('CLIPBOARD_WRITE_FAILED', error)
  }
  return text
}

export async function writeBrowserClipboardText(text) {
  const clipboard = globalThis.navigator?.clipboard
  if (typeof clipboard?.writeText !== 'function') {
    throw new ShareSafeClipboardError('CLIPBOARD_UNAVAILABLE')
  }
  await clipboard.writeText(text)
}
