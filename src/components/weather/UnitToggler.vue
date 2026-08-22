<script setup>
import { useConfigStore } from '../../stores/configStore'

const configStore = useConfigStore()
</script>

<template>
  <el-button plain size="small" @click="configStore.toggleUnit">
    단위: {{ configStore.unitSymbol }}
  </el-button>
</template>
