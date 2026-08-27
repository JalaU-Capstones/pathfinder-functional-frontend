<template>
  <AppLayout>
    <div class="maps-view">
      <div class="maps-view__header">
        <h1 class="maps-view__title">Maps</h1>
        <BaseButton
          v-if="!showForm"
          @click="openCreateForm"
        >
          New Map
        </BaseButton>
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

      <!-- Create map form panel -->
      <div v-if="showForm"
           class="maps-view__panel">
        <MapForm
          :loading="creating"
          :error="createError"
          @submit="handleCreateMap"
          @cancel="showForm = false"
        />
      </div>

      <!-- Edit map form -->
      <div v-if="editingMap"
           class="maps-view__panel maps-view__panel--edit">
        <MapForm
          :loading="updating"
          :error="updateError"
          :initial-data="editingMap"
          :edit-mode="true"
          @submit="handleUpdateMap"
          @cancel="cancelEdit"
        />
      </div>

      <div class="maps-view__content">
        <!-- Map list -->
        <div class="maps-view__list">
          <div v-if="loading" class="maps-view__loading">
            <p class="text-secondary">Loading maps...</p>
          </div>

          <div v-else-if="maps.length === 0"
               class="maps-view__empty">
            <p class="text-secondary">
              No maps found. Create your first map.
            </p>
          </div>

          <template v-else>
            <MapCard
              v-for="map in maps"
              :key="map.id"
              :map="map"
              :selected="selectedMap?.id === map.id"
              @select="selectMap"
              @edit="startEditMap"
              @delete="handleDeleteMap"
            />
          </template>
        </div>

        <!-- Map detail and grid -->
        <div class="maps-view__detail">
          <div v-if="!selectedMap"
               class="maps-view__no-selection">
            <p class="text-secondary">
              Select a map to view its grid.
            </p>
          </div>

          <div v-else class="maps-view__grid-panel">
            <div class="maps-view__grid-header">
              <h2 class="maps-view__grid-title">
                {{ selectedMap.name }}
              </h2>
              <span class="maps-view__grid-id font-mono">
                {{ selectedMap.id }}
              </span>
            </div>

            <MapGrid :map="selectedMap" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import MapCard from '@/components/MapCard.vue';
import MapForm from '@/components/MapForm.vue';
import MapGrid from '@/components/MapGrid.vue';
import { getAllMaps, createMap, updateMap, deleteMap } from '@/api';

const maps = ref([]);
const selectedMap = ref(null);
const loading = ref(false);
const creating = ref(false);
const showForm = ref(false);
const editingMap = ref(null);
const updating = ref(false);
const updateError = ref('');
const globalError = ref('');
const createError = ref('');
const successMessage = ref('');

const clearMessages = () => {
  globalError.value = '';
  successMessage.value = '';
  createError.value = '';
  updateError.value = '';
};

const fetchMaps = async () => {
  loading.value = true;
  globalError.value = '';
  try {
    maps.value = await getAllMaps();
  } catch (err) {
    globalError.value = err.message;
  } finally {
    loading.value = false;
  }
};

const selectMap = (map) => {
  selectedMap.value =
    selectedMap.value?.id === map.id ? null : map;
};

const openCreateForm = () => {
  showForm.value = true;
  editingMap.value = null;
};

const startEditMap = (map) => {
  editingMap.value = { ...map };
  showForm.value = false;
};

const cancelEdit = () => {
  editingMap.value = null;
  updateError.value = '';
};

const handleUpdateMap = async (payload) => {
  updating.value = true;
  updateError.value = '';
  try {
    const updated = await updateMap(
      editingMap.value.id, payload
    );
    maps.value = maps.value.map((m) =>
      m.id === updated.id ? { ...m, ...updated } : m
    );
    if (selectedMap.value?.id === updated.id) {
      selectedMap.value = { ...selectedMap.value, ...updated };
    }
    editingMap.value = null;
    successMessage.value =
      `Map "${updated.name}" updated successfully.`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    updateError.value = err.message;
  } finally {
    updating.value = false;
  }
};

const handleCreateMap = async (payload) => {
  creating.value = true;
  createError.value = '';
  try {
    const created = await createMap(payload);
    maps.value = [created, ...maps.value];
    selectedMap.value = created;
    showForm.value = false;
    const obstacleCount = (created.obstacles || []).length;
    const waypointCount = (created.waypoints || []).length;
    let msg = `Map "${created.name}" created successfully.`;
    if (obstacleCount > 0 || waypointCount > 0) {
      msg += ` Created with ${obstacleCount} obstacle(s)` +
             ` and ${waypointCount} waypoint(s).`;
    }
    successMessage.value = msg;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    createError.value = err.message;
  } finally {
    creating.value = false;
  }
};

const handleDeleteMap = async (map) => {
  if (!confirm(
    `Delete map "${map.name}"? ` +
    `This will also delete all its obstacles, waypoints, ` +
    `and routes.`
  )) return;

  clearMessages();
  try {
    await deleteMap(map.id);
    maps.value = maps.value.filter((m) => m.id !== map.id);
    if (selectedMap.value?.id === map.id) {
      selectedMap.value = null;
    }
    successMessage.value =
      `Map "${map.name}" deleted successfully.`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    globalError.value = err.message;
  }
};

onMounted(fetchMaps);
</script>

<style scoped>
.maps-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.maps-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.maps-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.maps-view__panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.maps-view__content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 1100px) {
  .maps-view__content {
    grid-template-columns: 1fr;
  }
}

.maps-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.maps-view__loading,
.maps-view__empty {
  padding: var(--space-8);
  text-align: center;
}

.maps-view__detail {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  min-height: 400px;
  overflow: hidden;
  max-width: 100%;
}

.maps-view__no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.maps-view__grid-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.maps-view__grid-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.maps-view__grid-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.maps-view__grid-id {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
