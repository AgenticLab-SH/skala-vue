<script setup>
defineProps({
  query: { type: String, default: '' },
})

const emit = defineEmits(['update-query'])
</script>

<template>
  <label class="search-box">
    도시 검색
    <el-input
      :model-value="query"
      placeholder="예: 창원"
      clearable
      @update:model-value="emit('update-query', $event)"
    />
  </label>
</template>

<style scoped>
.search-box {
  display: grid;
  gap: 6px;
  width: min(100%, 360px);
  font-weight: 700;
}
</style>
