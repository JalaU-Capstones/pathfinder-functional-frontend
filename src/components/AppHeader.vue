<template>
  <header class="app-header">
    <button
      class="app-header__hamburger"
      aria-label="Toggle navigation"
      @click="$emit('toggle-sidebar')"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div class="app-header__brand">
      <span class="app-header__title">Pathfinder</span>
      <span class="app-header__subtitle">Functional Backend</span>
    </div>

    <div class="app-header__actions">
      <StatusBadge
        :status="backendStatus"
        :label="backendStatusLabel"
      />
      
      <a
        href="http://localhost:3000/api-docs"
        target="_blank"
        rel="noopener noreferrer"
        class="app-header__docs-link"
        title="Open Swagger UI in new tab"
      >
        API Docs
      </a>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import StatusBadge from './StatusBadge.vue';
import { client } from '@/api/client.js';

defineProps({
  sidebarOpen: { type: Boolean, default: true },
});
defineEmits(['toggle-sidebar']);

const backendStatus = ref('checking');
const backendStatusLabel = ref('Checking...');

let healthInterval = null;

/**
 * checkBackendHealth — calls GET /api/health and updates
 * the status badge. Runs on mount and every 30 seconds.
 */
const checkBackendHealth = async () => {
  try {
    await client.get('/api/health');
    backendStatus.value = 'online';
    backendStatusLabel.value = 'Backend online';
  } catch {
    backendStatus.value = 'offline';
    backendStatusLabel.value = 'Backend offline';
  }
};

onMounted(() => {
  checkBackendHealth();
  healthInterval = setInterval(checkBackendHealth, 30000);
});

onUnmounted(() => {
  clearInterval(healthInterval);
});
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background-color: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: 100;
}

.app-header__brand {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.app-header__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-accent);
  letter-spacing: -0.01em;
}

.app-header__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-regular);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.app-header__docs-link {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.app-header__docs-link:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.app-header__hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-right: var(--space-3);
}

.app-header__hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.app-header__hamburger:hover span {
  background-color: var(--color-accent);
}

@media (max-width: 900px) {
  .app-header__hamburger {
    display: flex;
  }
}
</style>
