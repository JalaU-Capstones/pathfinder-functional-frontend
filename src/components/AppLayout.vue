<template>
  <div class="app-layout">
    <AppHeader />
    <AppSidebar />
    <main class="app-layout__content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: var(--color-bg-base);
}

.app-layout__content {
  margin-left: var(--sidebar-width);
  padding-top: var(--header-height);
  padding: calc(var(--header-height) + var(--space-6))
           var(--space-8)
           var(--space-8)
           calc(var(--sidebar-width) + var(--space-8));
  min-height: 100vh;
}
</style>
