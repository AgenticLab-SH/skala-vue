<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const userForm = ref({
  email: '',
  agree: false,
})
const productQuantity = ref(1)
const productRate = ref(4)
const downloadProgress = ref(0)
const isDownloading = ref(false)
let progressTimer = null

function handleRegister() {
  if (!userForm.value.email.includes('@')) {
    ElMessage.error('올바른 이메일 형식이 아닙니다.')
    return
  }
  if (!userForm.value.agree) {
    ElMessage.warning('이용약관에 동의해야 합니다.')
    return
  }
  ElMessage.success('가입 신청을 받았습니다.')
}

function confirmDelete() {
  ElMessageBox.confirm('목록에서 이 항목을 지울까요?', '삭제 확인', {
    confirmButtonText: '삭제',
    cancelButtonText: '취소',
    type: 'warning',
  })
    .then(() => ElMessage.success('삭제 요청을 처리했습니다.'))
    .catch(() => ElMessage.info('삭제를 취소했습니다.'))
}

function startDownload() {
  if (isDownloading.value) return

  isDownloading.value = true
  downloadProgress.value = 0
  progressTimer = window.setInterval(() => {
    downloadProgress.value += 20
    if (downloadProgress.value >= 100) {
      window.clearInterval(progressTimer)
      progressTimer = null
      isDownloading.value = false
      ElMessage.success('동기화를 마쳤습니다.')
    }
  }, 350)
}

onBeforeUnmount(() => {
  // 화면을 옮길 때 진행 중인 타이머도 같이 정리합니다.
  if (progressTimer) window.clearInterval(progressTimer)
})
</script>

<template>
  <div class="library-grid">
    <section id="challenge-246" class="library-item" tabindex="-1" aria-label="246쪽 실습">
      <p class="page-label">246쪽 · 폼 검증</p>
      <el-card shadow="never">
        <template #header>가입 신청</template>
        <el-form label-position="top">
          <el-form-item label="이메일">
            <el-input v-model="userForm.email" placeholder="name@example.com" />
          </el-form-item>
          <el-form-item>
            <el-switch v-model="userForm.agree" active-text="이용약관 동의" />
          </el-form-item>
          <el-button type="primary" @click="handleRegister">가입 신청</el-button>
        </el-form>
      </el-card>
    </section>

    <section id="challenge-247" class="library-item" tabindex="-1" aria-label="247쪽 실습">
      <p class="page-label">247쪽 · 수량과 평점</p>
      <el-card shadow="never">
        <template #header>수량과 평점</template>
        <el-form label-position="top">
          <el-form-item label="구매 수량">
            <el-input-number v-model="productQuantity" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="평점">
            <el-rate v-model="productRate" />
          </el-form-item>
        </el-form>
        <p>수량 {{ productQuantity }}개 · 평점 {{ productRate }}점</p>
      </el-card>
    </section>

    <section id="challenge-248" class="library-item" tabindex="-1" aria-label="248쪽 실습">
      <p class="page-label">248쪽 · 진행률과 확인창</p>
      <el-card shadow="never">
        <template #header>동기화와 삭제 확인</template>
        <el-progress :percentage="downloadProgress" />
        <div class="button-row">
          <el-button :disabled="isDownloading" @click="startDownload">동기화 시작</el-button>
          <el-button type="danger" plain @click="confirmDelete">삭제 확인</el-button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.library-item {
  min-width: 0;
  scroll-margin-top: 108px;
}

.library-item:focus {
  outline: 0;
}

.page-label {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.library-item :deep(.el-card) p {
  margin: 12px 0 0;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
</style>
