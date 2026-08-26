<template>
  <div class="app-layout">
    <AppHeader
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <!-- Overlay for mobile sidebar -->
    <div
      v-if="sidebarOpen && isMobile"
      class="app-layout__overlay"
      @click="sidebarOpen = false"
    />

    <AppSidebar
      :class="{ 'app-sidebar--open': sidebarOpen }"
      @navigate="isMobile && (sidebarOpen = false)"
    />

    <main class="app-layout__content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';

const COLLAPSE_AT = 900;
const sidebarOpen = ref(window.innerWidth >= COLLAPSE_AT);
const isMobile = ref(window.innerWidth < COLLAPSE_AT);

const handleResize = () => {
  const wide = window.innerWidth >= COLLAPSE_AT;
  isMobile.value = !wide;
  if (wide) {
    sidebarOpen.value = true;
  } else {
    sidebarOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: var(--color-bg-base);
}

.app-layout__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 85;
}

.app-layout__content {
  padding-top: var(--header-height);
  min-height: 100vh;
  overflow-x: hidden;
  /* Default: sidebar visible */
  margin-left: var(--sidebar-width);
  padding: calc(var(--header-height) + var(--space-6))
           var(--space-6)
           var(--space-8)
           calc(var(--sidebar-width) + var(--space-6));
  box-sizing: border-box;
}

/* When sidebar is collapsed: content takes full width */
@media (max-width: 900px) {
  .app-layout__content {
    margin-left: 0;
    padding: calc(var(--header-height) + var(--space-4))
             var(--space-4)
             var(--space-6)
             var(--space-4);
  }
}
</style>
