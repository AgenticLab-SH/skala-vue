<template>
  <section class="dashboard-card">
    <header>
      <slot name="title" />
    </header>
    <div class="dashboard-content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.dashboard-card {
  margin-top: 28px;
  padding: 20px;
  border: 1px solid #bbb;
}

header {
  margin-bottom: 18px;
}
</style>
