import './assets/main.css'
import 'element-plus/dist/index.css'

import {
  ElAlert,
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElProgress,
  ElRate,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import GlobalNotice from './components/component-practice/GlobalNotice.vue'
import router from './router'

const app = createApp(App)

app.component('GlobalNotice', GlobalNotice)
// 수업 실습에서 실제로 쓴 컴포넌트만 등록해 첫 화면 번들에 불필요한 코드를 넣지 않습니다.
;[
  ElAlert,
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElProgress,
  ElRate,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
].forEach((component) => app.component(component.name, component))
app.use(createPinia())
app.use(router)
app.mount('#app')
