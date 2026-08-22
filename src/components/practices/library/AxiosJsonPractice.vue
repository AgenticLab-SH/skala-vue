<script setup>
import { ref } from 'vue'

import { jsonPlaceholderApi } from '../../../services/jsonPlaceholderApi'

const posts = ref([])
const draftTitle = ref('창원 관측 메모')
const requestState = ref('idle')
const resultMessage = ref('')
const errorMessage = ref('')

async function runRequest(label, request) {
  requestState.value = 'loading'
  resultMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await request()
    requestState.value = 'success'
    resultMessage.value = `${label} 요청이 완료되었습니다. 상태 코드: ${response.status}`
    return response
  } catch (error) {
    requestState.value = 'error'
    const status = error.response?.status ?? '네트워크 오류'
    errorMessage.value = `${label} 요청이 완료되지 않았습니다. 상태 코드: ${status}`
    return null
  }
}

async function loadPosts() {
  const response = await runRequest('GET', () =>
    jsonPlaceholderApi.get('/posts', { params: { _limit: 3 } }),
  )
  if (response) posts.value = response.data
}

async function createPost() {
  const response = await runRequest('POST', () =>
    jsonPlaceholderApi.post('/posts', {
      title: draftTitle.value.trim() || '제목 없음',
      body: 'Axios로 보낸 연습용 요청입니다.',
      userId: 1,
    }),
  )
  if (response) posts.value = [response.data, ...posts.value]
}

async function updatePost() {
  const response = await runRequest('PATCH', () =>
    jsonPlaceholderApi.patch('/posts/1', { title: draftTitle.value.trim() || '수정한 제목' }),
  )
  if (response) posts.value = [response.data, ...posts.value.filter((post) => post.id !== 1)]
}

async function removePost() {
  const response = await runRequest('DELETE', () => jsonPlaceholderApi.delete('/posts/1'))
  if (response) posts.value = posts.value.filter((post) => post.id !== 1)
}

function checkMissingRoute() {
  runRequest('없는 경로 GET', () => jsonPlaceholderApi.get('/missing-posts'))
}
</script>

<template>
  <section class="practice-card" aria-live="polite">
    <h2>Axios JSON 요청</h2>
    <div class="control-row">
      <el-input v-model="draftTitle" aria-label="요청 제목" placeholder="요청 제목" />
      <el-button :loading="requestState === 'loading'" @click="loadPosts">GET</el-button>
      <el-button :loading="requestState === 'loading'" @click="createPost">POST</el-button>
      <el-button :loading="requestState === 'loading'" @click="updatePost">PATCH</el-button>
      <el-button :loading="requestState === 'loading'" @click="removePost">DELETE</el-button>
    </div>

    <div class="failure-row">
      <el-button link type="danger" @click="checkMissingRoute">없는 경로 조회</el-button>
    </div>

    <el-alert
      v-if="requestState === 'success'"
      :closable="false"
      :title="resultMessage"
      type="success"
    />
    <el-alert
      v-else-if="requestState === 'error'"
      :closable="false"
      :title="errorMessage"
      type="error"
    />

    <el-table v-if="posts.length" :data="posts" size="small">
      <el-table-column label="ID" prop="id" width="64" />
      <el-table-column label="제목" prop="title" />
    </el-table>
  </section>
</template>

<style scoped>
.control-row {
  margin-bottom: 10px;
}

.control-row :deep(.el-input) {
  flex: 1 1 220px;
}

.failure-row {
  margin-bottom: 12px;
}

.el-alert,
.el-table {
  margin-top: 12px;
}
</style>
