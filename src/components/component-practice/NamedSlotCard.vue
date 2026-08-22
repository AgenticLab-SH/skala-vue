<template>
  <article class="slot-card">
    <header>
      <slot name="header">제목 슬롯에 전달한 내용이 없습니다.</slot>
    </header>
    <div class="slot-content">
      <slot>본문 슬롯에 전달한 내용이 없습니다.</slot>
    </div>
  </article>
</template>

<style scoped>
.slot-card {
  margin-top: 10px;
  border: 1px solid #bbb;
}

header,
.slot-content {
  padding: 14px;
}

header {
  border-bottom: 1px solid #bbb;
}
</style>
