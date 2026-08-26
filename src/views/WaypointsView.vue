<template>
  <AppLayout>
    <div class="waypoints-view">
      <div class="waypoints-view__header">
        <div>
          <h1 class="waypoints-view__title">Waypoints</h1>
          <p class="waypoints-view__subtitle text-secondary">
            Add stopping points to maps. The A* algorithm
            will route through all waypoints in order.
            Waypoints appear yellow on the grid.
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

      <div class="waypoints-view__content">
        <div class="waypoints-view__panel">
          <WaypointForm
            :maps="maps"
            :loading="creating"
            :error="createError"
            @submit="handleCreateWaypoint"
          />

          <div v-if="previewMap"
               class="waypoints-view__preview">
            <h3 class="waypoints-view__preview-title">
              Map Preview: {{ previewMap.name }}
            </h3>
            <MapGrid :map="previewMap" />
          </div>
        </div>

        <div class="waypoints-view__table-panel">
          <div class="waypoints-view__table-header">
            <h2 class="waypoints-view__section-title">
              All Waypoints
            </h2>
            <div class="waypoints-view__filter">
              <label class="waypoints-view__filter-label"
                     for="wp-filter-map">
                Filter by map:
              </label>
              <select
                id="wp-filter-map"
                v-model="filterMapId"
                class="waypoints-view__select"
                @change="fetchWaypoints"
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
            :columns="waypointColumns"
            :rows="waypoints"
            :loading="loading"
            empty-message="No waypoints found.
              Add one using the form."
            @delete="handleDeleteWaypoint"
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
import WaypointForm from '@/components/WaypointForm.vue';
import EntityTable from '@/components/EntityTable.vue';
import MapGrid from '@/components/MapGrid.vue';
import {
  getAllWaypoints,
  createWaypoint,
  deleteWaypoint,
  getAllMaps,
  getMapById,
} from '@/api';

const maps = ref([]);
const waypoints = ref([]);
const previewMap = ref(null);
const filterMapId = ref('');
const loading = ref(false);
const creating = ref(false);
const globalError = ref('');
const createError = ref('');
const successMessage = ref('');

const waypointColumns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: 'Name' },
  { key: 'position.x', label: 'X', mono: true },
  { key: 'position.y', label: 'Y', mono: true },
  { key: 'mapId', label: 'Map ID', mono: true },
];

const fetchMaps = async () => {
  try {
    maps.value = await getAllMaps();
  } catch (err) {
    globalError.value = err.message;
  }
};

const fetchWaypoints = async () => {
  loading.value = true;
  try {
    waypoints.value = await getAllWaypoints(
      filterMapId.value || undefined
    );
  } catch (err) {
    globalError.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleCreateWaypoint = async (payload) => {
  creating.value = true;
  createError.value = '';
  try {
    await createWaypoint(payload);
    await fetchWaypoints();

    const updatedMap = await getMapById(payload.mapId);
    previewMap.value = updatedMap;

    successMessage.value =
      `Waypoint "${payload.name}" added at ` +
      `(${payload.position.x}, ${payload.position.y}).`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    createError.value = err.message;
  } finally {
    creating.value = false;
  }
};

const handleDeleteWaypoint = async (waypoint) => {
  if (!confirm(
    `Delete waypoint "${waypoint.name}"?`
  )) return;

  globalError.value = '';
  try {
    await deleteWaypoint(waypoint.id);
    waypoints.value =
      waypoints.value.filter((w) => w.id !== waypoint.id);

    if (previewMap.value?.id === waypoint.mapId) {
      previewMap.value = await getMapById(waypoint.mapId);
    }

    successMessage.value = `Waypoint "${waypoint.name}" deleted.`;
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (err) {
    globalError.value = err.message;
  }
};

onMounted(async () => {
  await fetchMaps();
  await fetchWaypoints();
});
</script>

<style scoped>
.waypoints-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.waypoints-view__header {
  display: flex;
  align-items: flex-start;
}

.waypoints-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.waypoints-view__subtitle {
  font-size: var(--text-sm);
  margin-top: var(--space-1);
  max-width: 50ch;
}

.waypoints-view__content {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 1100px) {
  .waypoints-view__content {
    grid-template-columns: 1fr;
  }
}

.waypoints-view__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.waypoints-view__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.waypoints-view__preview-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
}

.waypoints-view__table-panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.waypoints-view__panel,
.waypoints-view__table-panel {
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.waypoints-view__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.waypoints-view__section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.waypoints-view__filter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.waypoints-view__filter-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.waypoints-view__select {
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
}

.waypoints-view__select:focus {
  border-color: var(--color-accent);
}
</style>
