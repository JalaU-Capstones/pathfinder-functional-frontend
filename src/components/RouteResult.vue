<template>
  <div class="route-result">
    <div class="route-result__header">
      <h3 class="route-result__title">Route Result</h3>
      <div class="route-result__stats">
        <div class="route-result__stat">
          <span class="route-result__stat-label">Distance</span>
          <span class="route-result__stat-value
            route-result__stat-value--accent font-mono">
            {{ route.distance }} steps
          </span>
        </div>
        <div class="route-result__stat">
          <span class="route-result__stat-label">
            Path length
          </span>
          <span class="route-result__stat-value font-mono">
            {{ route.optimal_path?.length ?? 0 }} cells
          </span>
        </div>
        <div class="route-result__stat">
          <span class="route-result__stat-label">Start</span>
          <span class="route-result__stat-value font-mono">
            ({{ route.start.x }}, {{ route.start.y }})
          </span>
        </div>
        <div class="route-result__stat">
          <span class="route-result__stat-label">End</span>
          <span class="route-result__stat-value font-mono">
            ({{ route.end.x }}, {{ route.end.y }})
          </span>
        </div>
      </div>
    </div>

    <div class="route-result__progress" v-if="animating">
      <div
        class="route-result__progress-bar"
        :style="{ width: `${animationProgress}%` }"
      ></div>
      <span class="route-result__progress-label">
        Drawing path... {{ drawnPath.length }} /
        {{ route.optimal_path?.length ?? 0 }} cells
      </span>
    </div>

    <MapGrid
      :map="map"
      :path="drawnPath"
      :start-point="route.start"
      :end-point="route.end"
    />

    <div class="route-result__id">
      <span class="text-muted">Route ID: </span>
      <span class="font-mono text-muted" style="font-size: var(--text-xs)">
        {{ route.id }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import MapGrid from './MapGrid.vue';

const props = defineProps({
  route: { type: Object, required: true },
  map: { type: Object, required: true },
  animate: { type: Boolean, default: true },
});

const drawnPath = ref([]);
const animating = ref(false);
let animationTimer = null;

const animationProgress = computed(() => {
  const total = props.route.optimal_path?.length ?? 0;
  if (total === 0) return 100;
  return Math.round((drawnPath.value.length / total) * 100);
});

/**
 * animatePath — progressively adds cells to drawnPath
 * one by one, creating an animation effect that shows
 * the A* algorithm's computed route being drawn.
 *
 * Speed: 30ms per cell — fast enough to feel immediate
 * on short paths, visible on long paths.
 */
const animatePath = () => {
  const fullPath = props.route.optimal_path ?? [];
  if (!props.animate || fullPath.length === 0) {
    drawnPath.value = fullPath;
    return;
  }

  drawnPath.value = [];
  animating.value = true;
  let index = 0;

  const step = () => {
    if (index < fullPath.length) {
      drawnPath.value = [...drawnPath.value, fullPath[index]];
      index++;
      animationTimer = setTimeout(step, 30);
    } else {
      animating.value = false;
    }
  };

  step();
};

onMounted(animatePath);

watch(
  () => props.route.id,
  () => {
    clearTimeout(animationTimer);
    animatePath();
  }
);

onUnmounted(() => {
  clearTimeout(animationTimer);
});
</script>

<style scoped>
.route-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.route-result__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.route-result__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.route-result__stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
}

.route-result__stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: var(--color-bg-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.route-result__stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.route-result__stat-value {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.route-result__stat-value--accent {
  color: var(--color-accent);
}

.route-result__progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.route-result__progress-bar {
  height: 3px;
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width 0.05s linear;
}

.route-result__progress-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.route-result__id {
  font-size: var(--text-xs);
}
</style>
