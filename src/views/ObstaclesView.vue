<template>
  <AppLayout>
    <div class="obstacles-view">
      <div class="obstacles-view__header">
        <div>
          <h1 class="obstacles-view__title">Obstacles</h1>
          <p class="obstacles-view__subtitle text-secondary">
            Add obstacles to maps to define the terrain.
            Obstacles block pathfinding and appear red
            on the grid.
          </p>
        </div>
      </div>

      <BaseAlert
        v-if="globalError"
        type="error"
        :message="globalError"
        dismissible
      />
      <BaseAlert
        v-if="successMessage"
        type="success"
        :message="successMessage"
        dismissible
      />

      <div class="obstacles-view__content">
        <!-- Form panel -->
        <div class="obstacles-view__panel">
          <ObstacleForm
            :maps="maps"
            :loading="creating"
            :error="createError"
            @submit="handleCreateObstacle"
          />

          <!-- Map preview after adding obstacle -->
          <div v-if="previewMap"
               class="obstacles-view__preview">
            <h3 class="obstacles-view__preview-title">
              Map Preview: {{ previewMap.name }}
            </h3>
            <MapGrid :map="previewMap" />
          </div>
        </div>

        <!-- Obstacles table -->
        <div class="obstacles-view__table-panel">
          <div class="obstacles-view__table-header">
            <h2 class="obstacles-view__section-title">
              All Obstacles
            </h2>
            <div class="obstacles-view__filter">
              <label class="obstacles-view__filter-label"
                     for="filter-map">
                Filter by map:
              </label>
              <select
                id="filter-map"
                v-model="filterMapId"
                class="obstacles-view__select"
                @change="fetchObstacles"
              >
                <option value="">All maps</option>
                <option
                  v-for="map in maps"
                  :key="map.id"
                  :value="map.id"
                >
                  {{ map.name }}
                </option>
              </select>
            </div>
          </div>

          <EntityTable
            :columns="obstacleColumns"
            :rows="obstacles"
            :loading="loading"
            empty-message="No obstacles found.
              Add one using the form."
            @delete="handleDeleteObstacle"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import ObstacleForm from '@/components/ObstacleForm.vue';
import EntityTable from '@/components/EntityTable.vue';
import MapGrid from '@/components/MapGrid.vue';
import {
  getAllObstacles,
  createObstacle,
  deleteObstacle,
  getAllMaps,
  getMapById,
} from '@/api';

const maps = ref([]);
const obstacles = ref([]);
const previewMap = ref(null);
const filterMapId = ref('');
const loading = ref(false);
const creating = ref(false);
const globalError = ref('');
const createError = ref('');
const successMessage = ref('');

const obstacleColumns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'position.x', label: 'X', mono: true },
  { key: 'position.y', label: 'Y', mono: true },
  { key: 'size', label: 'Size', mono: true },
  { key: 'mapId', label: 'Map ID', mono: true },
];

const fetchMaps = async () => {
  try {
    maps.value = await getAllMaps();
  } catch (err) {
    globalError.value = err.message;
  }
};

const fetchObstacles = async () => {
  loading.value = true;
  try {
    obstacles.value = await getAllObstacles(
      filterMapId.value || undefined
    );
  } catch (err) {
    globalError.value = err.message;
  } finally {
    loading.value = false;
  }
};

/**
 * handleCreateObstacle — creates the obstacle and then
 * refreshes the map preview to show the updated grid.
 */
const handleCreateObstacle = async (payload) => {
  creating.value = true;
  createError.value = '';
  try {
    await createObstacle(payload);
    await fetchObstacles();

    // Refresh the map to show the updated grid with
    // the new obstacle rendered in red
    const updatedMap = await getMapById(payload.mapId);
    previewMap.value = updatedMap;

    successMessage.value =
      `Obstacle added at (${payload.position.x}, ` +
      `${payload.position.y}) successfully.`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    createError.value = err.message;
  } finally {
    creating.value = false;
  }
};

const handleDeleteObstacle = async (obstacle) => {
  if (!confirm(
    `Delete obstacle at (${obstacle.position.x}, ` +
    `${obstacle.position.y})?`
  )) return;

  globalError.value = '';
  try {
    await deleteObstacle(obstacle.id);
    obstacles.value =
      obstacles.value.filter((o) => o.id !== obstacle.id);

    // Refresh preview if it shows the affected map
    if (previewMap.value?.id === obstacle.mapId) {
      previewMap.value = await getMapById(obstacle.mapId);
    }

    successMessage.value = 'Obstacle deleted.';
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (err) {
    globalError.value = err.message;
  }
};

onMounted(async () => {
  await fetchMaps();
  await fetchObstacles();
});
</script>

<style scoped>
.obstacles-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.obstacles-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.obstacles-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.obstacles-view__subtitle {
  font-size: var(--text-sm);
  margin-top: var(--space-1);
  max-width: 50ch;
}

.obstacles-view__content {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 1100px) {
  .obstacles-view__content {
    grid-template-columns: 1fr;
  }
}

.obstacles-view__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.obstacles-view__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.obstacles-view__preview-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
}

.obstacles-view__table-panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.obstacles-view__panel,
.obstacles-view__table-panel {
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.obstacles-view__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.obstacles-view__section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.obstacles-view__filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.obstacles-view__filter-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.obstacles-view__select {
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
}

.obstacles-view__select:focus {
  border-color: var(--color-accent);
}
</style>
