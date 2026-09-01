<template>
  <AppLayout>
    <div class="home-view">
      <div class="home-view__header">
        <h1 class="home-view__title">Pathfinder</h1>
        <p class="home-view__description">
          Functional backend for path-finding operations.
          Built with Node.js, Express, and PostgreSQL using
          functional programming principles and a three-layer
          architecture.
        </p>
      </div>

      <div class="home-view__status-card">
        <h2 class="home-view__section-title">
          Backend Status
        </h2>
        <div class="home-view__status-row">
          <StatusBadge
            :status="backendStatus"
            :label="backendStatusLabel"
            size="md"
          />
          <span class="home-view__endpoint font-mono">
            http://localhost:3000
          </span>
        </div>
        <p v-if="backendError" class="home-view__error">
          {{ backendError }}
        </p>
      </div>

      <div class="home-view__cards">
        <RouterLink
          v-for="section in sections"
          :key="section.name"
          :to="section.path"
          class="home-view__card"
        >
          <h3 class="home-view__card-title">
            {{ section.label }}
          </h3>
          <p class="home-view__card-description">
            {{ section.description }}
          </p>
          <span class="home-view__card-link">
            Open section
          </span>
        </RouterLink>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { client } from '@/api/client.js';

const backendStatus = ref('checking');
const backendStatusLabel = ref('Checking backend...');
const backendError = ref(null);

const checkHealth = async () => {
  try {
    await client.get('/api/health');
    backendStatus.value = 'online';
    backendStatusLabel.value = 'Backend is online';
    backendError.value = null;
  } catch (err) {
    backendStatus.value = 'offline';
    backendStatusLabel.value = 'Backend is offline';
    backendError.value = err.message;
  }
};

onMounted(checkHealth);

const sections = [
  {
    name: 'maps',
    label: 'Maps',
    path: '/maps',
    description:
      'Create and manage maps with configurable dimensions. ' +
      'Visualize the grid with obstacles and waypoints.',
  },
  {
    name: 'routes',
    label: 'Routes',
    path: '/routes',
    description:
      'Calculate optimal paths between two points using ' +
      'the A* algorithm. Visualize the computed path on the grid.',
  },
  {
    name: 'profile',
    label: 'Profile',
    path: '/profile',
    description:
      'Manage your account, name, email, and preferences.',
  },
  {
    name: 'validation',
    label: 'Validation',
    path: '/validation',
    description:
      'Run backend validation operations: UUID format checks, ' +
      'cycle detection, reachability analysis, and more.',
  },
];
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: var(--content-max-width);
}

.home-view__title {
  font-size: var(--text-3xl);
  color: var(--color-accent);
  margin-bottom: var(--space-3);
}

.home-view__description {
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  max-width: 60ch;
  line-height: 1.6;
}

.home-view__section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-xs);
  margin-bottom: var(--space-4);
}

.home-view__status-card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.home-view__status-row {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.home-view__endpoint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.home-view__error {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-error);
}

.home-view__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.home-view__card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.home-view__card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-accent);
}

.home-view__card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.home-view__card-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  flex-grow: 1;
}

.home-view__card-link {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-accent);
  margin-top: var(--space-2);
}
</style>
