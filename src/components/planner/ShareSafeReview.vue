<script setup>
import { computed, ref, watch } from 'vue'

import {
  copyShareSafeRouteText,
  createShareSafeRouteReview,
  createShareSafeRouteSnapshot,
  writeBrowserClipboardText,
} from '../../utils/shareSafeRoute'

const props = defineProps({
  recommendation: { type: Object, required: true },
  activityLabel: { type: String, required: true },
  clipboardWriter: { type: Function, default: writeBrowserClipboardText },
})

const reviewed = ref(false)
const showText = ref(false)
const copyStatus = ref('idle')
const copyMessage = ref('')
const reviewSnapshot = ref('')
const reviewNow = ref(new Date())
const review = computed(() =>
  createShareSafeRouteReview(props.recommendation, {
    activityLabel: props.activityLabel,
    now: reviewNow.value,
  }),
)
const currentSnapshot = computed(() =>
  createShareSafeRouteSnapshot(props.recommendation, {
    activityLabel: props.activityLabel,
    now: reviewNow.value,
  }),
)
const isReviewCurrent = computed(
  () => reviewed.value && reviewSnapshot.value === currentSnapshot.value,
)

watch(currentSnapshot, (nextSnapshot) => {
  if (reviewed.value && reviewSnapshot.value !== nextSnapshot) {
    reviewed.value = false
    showText.value = false
    copyStatus.value = 'stale'
    copyMessage.value = '추천 결과가 바뀌어 복사를 잠갔습니다. 변경된 내용을 다시 검토해 주세요.'
  }
})

function handleReviewChange() {
  showText.value = false
  copyStatus.value = 'idle'
  copyMessage.value = ''
  if (reviewed.value) {
    reviewNow.value = new Date()
    reviewSnapshot.value = currentSnapshot.value
  } else {
    reviewSnapshot.value = ''
  }
}

async function copySafeText() {
  copyStatus.value = 'pending'
  copyMessage.value = ''
  const copyNow = new Date()
  try {
    await copyShareSafeRouteText(props.recommendation, {
      activityLabel: props.activityLabel,
      reviewed: reviewed.value,
      reviewedSnapshot: reviewSnapshot.value,
      writeText: props.clipboardWriter,
      now: copyNow,
    })
    copyStatus.value = 'success'
    copyMessage.value = '검토한 공유용 텍스트를 클립보드에 복사했습니다.'
  } catch (error) {
    if (error?.code === 'STALE_REVIEW') {
      reviewed.value = false
      showText.value = false
      reviewSnapshot.value = ''
      copyStatus.value = 'stale'
      copyMessage.value = '추천 결과가 바뀌어 복사를 잠갔습니다. 변경된 내용을 다시 검토해 주세요.'
    } else {
      copyStatus.value = 'error'
      copyMessage.value =
        error?.code === 'CLIPBOARD_UNAVAILABLE'
          ? '이 브라우저에서는 클립보드 복사를 사용할 수 없습니다.'
          : '복사가 취소되었거나 권한이 거부되었습니다. 외부로 전송된 내용은 없습니다.'
    }
  }
}
</script>

<template>
  <aside class="share-review" aria-labelledby="share-review-title">
    <header>
      <div>
        <p class="eyebrow">공유 전 개인정보 검토</p>
        <h3 id="share-review-title">정확한 위치와 시각을 빼고 결과를 정리합니다.</h3>
      </div>
      <span class="review-required">사용자 확인 필수</span>
    </header>

    <dl class="review-signals">
      <div>
        <dt>정확도</dt>
        <dd>{{ review.accuracy.label }}</dd>
        <small>{{ review.accuracy.caveat }}</small>
      </div>
      <div>
        <dt>freshness</dt>
        <dd>{{ review.freshness.label }}</dd>
        <small>{{ review.freshness.caveat }}</small>
      </div>
      <div>
        <dt>민감성</dt>
        <dd>{{ review.sensitivity.label }}</dd>
        <small>{{ review.sensitivity.caveat }}</small>
      </div>
    </dl>

    <div class="review-boundary">
      <section>
        <h4>포함</h4>
        <ul>
          <li v-for="item in review.included" :key="item">{{ item }}</li>
        </ul>
      </section>
      <section class="excluded">
        <h4>제외</h4>
        <ul>
          <li v-for="item in review.excluded" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>

    <label class="review-check">
      <input v-model="reviewed" type="checkbox" @change="handleReviewChange" />
      <span>포함·제외 항목과 최신성 경고를 확인했습니다.</span>
    </label>
    <button
      type="button"
      :disabled="!isReviewCurrent || copyStatus === 'pending'"
      @click="showText = true"
    >
      공유용 텍스트 확인
    </button>

    <div v-if="showText && isReviewCurrent" class="share-output">
      <label for="share-safe-text">공유 전에 아래 내용도 한 번 더 확인하세요.</label>
      <textarea id="share-safe-text" :value="review.summary" rows="7" readonly></textarea>
      <button
        type="button"
        :disabled="!isReviewCurrent || copyStatus === 'pending'"
        @click="copySafeText"
      >
        {{ copyStatus === 'pending' ? '복사 확인 중…' : '검토한 텍스트 복사' }}
      </button>
      <p>버튼을 누를 때만 클립보드에 복사합니다. Web Share나 네트워크 전송은 하지 않습니다.</p>
    </div>
    <p v-if="copyMessage" class="copy-status" :data-status="copyStatus" aria-live="polite">
      {{ copyMessage }}
    </p>
  </aside>
</template>

<style scoped>
.share-review {
  padding: clamp(22px, 4vw, 34px);
  margin-top: 20px;
  border: 1px solid rgba(49, 91, 119, 0.2);
  border-radius: var(--radius-panel);
  background: rgba(245, 250, 252, 0.94);
  box-shadow: 0 12px 34px rgba(24, 40, 56, 0.08);
}

header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow,
h3,
h4,
p {
  margin: 0;
}

.eyebrow {
  color: var(--accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

h3 {
  margin-top: 7px;
  font-size: clamp(20px, 3vw, 28px);
  letter-spacing: -0.045em;
}

.review-required {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(212, 109, 55, 0.12);
  color: #96461d;
  font-size: 11px;
  font-weight: 800;
}

.review-signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 22px 0 0;
}

.review-signals > div {
  padding: 15px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}

dt {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

dd {
  margin: 5px 0 0;
  font-weight: 800;
}

.review-signals small {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
}

.review-boundary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.review-boundary section {
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(66, 141, 111, 0.09);
}

.review-boundary .excluded {
  background: rgba(173, 91, 77, 0.08);
}

h4 {
  font-size: 13px;
}

ul {
  display: grid;
  gap: 5px;
  padding-left: 18px;
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.review-check {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 700;
}

.review-check input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  background: var(--ink);
  color: white;
  font-weight: 800;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.share-output {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.share-output label {
  font-size: 13px;
  font-weight: 800;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  line-height: 1.6;
  resize: vertical;
}

.share-output p {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.copy-status[data-status='success'] {
  color: #287354;
  font-weight: 800;
}

.copy-status[data-status='error'] {
  color: #a34b34;
  font-weight: 800;
}

.copy-status[data-status='stale'] {
  margin-top: 12px;
  color: #a34b34;
  font-weight: 800;
}

@media (max-width: 760px) {
  header {
    display: grid;
  }

  .review-required {
    justify-self: start;
  }

  .review-signals,
  .review-boundary {
    grid-template-columns: 1fr;
  }

  button {
    width: 100%;
  }
}
</style>
