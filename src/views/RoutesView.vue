<template>
  <AppLayout>
    <div class="routes-view">
      <div class="routes-view__header">
        <h1 class="routes-view__title">Routes</h1>
        <div class="routes-view__header-actions">
          <BaseButton
            :variant="activeTab === 'calculate'
              ? 'primary' : 'secondary'"
            size="sm"
            @click="activeTab = 'calculate'"
          >
            Calculate Route
          </BaseButton>
          <BaseButton
            :variant="activeTab === 'saved'
              ? 'primary' : 'secondary'"
            size="sm"
            @click="activeTab = 'saved'"
          >
            Saved Routes
          </BaseButton>
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

      <!-- Calculate tab -->
      <div v-if="activeTab === 'calculate'"
           class="routes-view__content">
        <div class="routes-view__panel">
          <h2 class="routes-view__panel-title">
            New Route
          </h2>
          <RouteForm
            :maps="maps"
            :loading="calculating"
            @submit="handleCalculateRoute"
          />
          <BaseAlert
            v-if="calculateError"
            type="error"
            :message="calculateError"
          />
        </div>

        <div class="routes-view__result-panel"
             v-if="calculatedRoute">
          <RouteResult
            :route="calculatedRoute"
            :map="calculatedRouteMap"
            :animate="true"
          />
        </div>
      </div>

      <!-- Saved routes tab -->
      <div v-if="activeTab === 'saved'"
           class="routes-view__content">
        <div class="routes-view__list">
          <div v-if="loadingRoutes"
               class="routes-view__loading">
            <p class="text-secondary">Loading routes...</p>
          </div>

          <div v-else-if="savedRoutes.length === 0"
               class="routes-view__empty">
            <p class="text-secondary">
              No saved routes. Calculate a route first.
            </p>
          </div>

          <template v-else>
            <RouteCard
              v-for="route in savedRoutes"
              :key="route.id"
              :route="route"
              :selected="selectedRoute?.id === route.id"
              @select="selectRoute"
              @delete="handleDeleteRoute"
            />
          </template>
        </div>

        <div class="routes-view__detail"
             v-if="activeTab === 'saved'">
          <div v-if="!selectedRoute"
               class="routes-view__no-selection">
            <p class="text-secondary">
              Select a route to view it on the grid.
            </p>
          </div>
          <div v-else-if="selectedRouteMap">
            <RouteResult
              :route="selectedRoute"
              :map="selectedRouteMap"
              :animate="false"
            />
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
import RouteForm from '@/components/RouteForm.vue';
import RouteResult from '@/components/RouteResult.vue';
import RouteCard from '@/components/RouteCard.vue';
import { getAllMaps, getMapById } from '@/api';
import { getAllRoutes, createRoute, deleteRoute } from '@/api';

const activeTab = ref('calculate');
const maps = ref([]);
const savedRoutes = ref([]);
const selectedRoute = ref(null);
const selectedRouteMap = ref(null);
const calculatedRoute = ref(null);
const calculatedRouteMap = ref(null);

const loadingRoutes = ref(false);
const calculating = ref(false);
const globalError = ref('');
const calculateError = ref('');
const successMessage = ref('');

const clearMessages = () => {
  globalError.value = '';
  successMessage.value = '';
  calculateError.value = '';
};

const fetchMaps = async () => {
  try {
    maps.value = await getAllMaps();
  } catch (err) {
    globalError.value =
      `Failed to load maps: ${err.message}`;
  }
};

const fetchRoutes = async () => {
  loadingRoutes.value = true;
  try {
    savedRoutes.value = await getAllRoutes();
  } catch (err) {
    globalError.value =
      `Failed to load routes: ${err.message}`;
  } finally {
    loadingRoutes.value = false;
  }
};

/**
 * handleCalculateRoute — calls the backend A* algorithm.
 * On success, stores the result and triggers the path
 * animation in RouteResult via :animate="true".
 */
const handleCalculateRoute = async (payload) => {
  calculating.value = true;
  calculateError.value = '';
  calculatedRoute.value = null;
  calculatedRouteMap.value = null;

  try {
    const route = await createRoute(payload);
    const map = maps.value.find(
      (m) => m.id === payload.mapId
    );
    calculatedRoute.value = route;
    calculatedRouteMap.value = map || null;

    // Add to saved routes list if on saved tab later
    savedRoutes.value = [route, ...savedRoutes.value];

    successMessage.value =
      `Route calculated. Distance: ${route.distance} steps, ` +
      `${route.optimal_path?.length ?? 0} cells in path.`;
    setTimeout(() => { successMessage.value = ''; }, 6000);
  } catch (err) {
    calculateError.value = err.message;
  } finally {
    calculating.value = false;
  }
};

/**
 * selectRoute — fetches the map for the selected route
 * so it can be displayed in RouteResult.
 */
const selectRoute = async (route) => {
  if (selectedRoute.value?.id === route.id) {
    selectedRoute.value = null;
    selectedRouteMap.value = null;
    return;
  }

  selectedRoute.value = route;
  selectedRouteMap.value = null;

  try {
    const map = maps.value.find((m) => m.id === route.mapId);
    selectedRouteMap.value = map
      || await getMapById(route.mapId);
  } catch (err) {
    globalError.value =
      `Failed to load map for route: ${err.message}`;
  }
};

const handleDeleteRoute = async (route) => {
  if (!confirm(
    `Delete this route from (${route.start.x},` +
    `${route.start.y}) to ` +
    `(${route.end.x},${route.end.y})?`
  )) return;

  clearMessages();
  try {
    await deleteRoute(route.id);
    savedRoutes.value =
      savedRoutes.value.filter((r) => r.id !== route.id);
    if (selectedRoute.value?.id === route.id) {
      selectedRoute.value = null;
      selectedRouteMap.value = null;
    }
    successMessage.value = 'Route deleted successfully.';
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (err) {
    globalError.value = err.message;
  }
};

onMounted(async () => {
  await fetchMaps();
  await fetchRoutes();
});
</script>

<style scoped>
.routes-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.routes-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.routes-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.routes-view__header-actions {
  display: flex;
  gap: var(--space-2);
}

.routes-view__panel-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-5);
}

.routes-view__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 1200px) {
  .routes-view__content {
    grid-template-columns: 1fr;
  }
}

.routes-view__panel,
.routes-view__result-panel,
.routes-view__detail {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.routes-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.routes-view__loading,
.routes-view__empty,
.routes-view__no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  min-height: 200px;
}
</style>
