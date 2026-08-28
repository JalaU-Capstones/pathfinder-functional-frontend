<template>
  <div
    class="map-card"
    :class="{ 'map-card--selected': selected }"
    role="button"
    tabindex="0"
    @click="$emit('select', map)"
    @keydown.enter="$emit('select', map)"
  >
    <div class="map-card__body">
      <h3 class="map-card__name">{{ map.name }}</h3>
      <p class="map-card__meta font-mono">
        {{ map.dimensions.width }} x {{ map.dimensions.height }}
        <span
          class="map-card__render-badge"
          :class="`map-card__render-badge--${renderingMode.toLowerCase()}`"
        >{{ renderingMode }}</span>
      </p>
      <div class="map-card__counts">
        <span class="map-card__count map-card__count--obstacle">
          {{ (map.obstacles || []).length }} obstacles
        </span>
        <span class="map-card__count map-card__count--waypoint">
          {{ (map.waypoints || []).length }} waypoints
        </span>
      </div>
    </div>
    <div class="map-card__actions">
      <BaseButton
        variant="secondary"
        size="sm"
        @click.stop="$emit('edit', map)"
        aria-label="Edit map"
      >
        Edit
      </BaseButton>
      <BaseButton
        variant="danger"
        size="sm"
        @click.stop="$emit('delete', map)"
        aria-label="Delete map"
      >
        Delete
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BaseButton from './BaseButton.vue';

const props = defineProps({
  map: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select', 'delete', 'edit']);

/**
 * renderingMode — matches MapGrid's CANVAS_THRESHOLD (22,500 cells).
 * Shows users which rendering engine will be used for this map.
 */
const renderingMode = computed(() =>
  props.map.dimensions.width * props.map.dimensions.height > 22500
    ? 'Canvas' : 'DOM'
);
</script>

<style scoped>
.map-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.map-card:hover {
  border-color: var(--color-accent);
}

.map-card--selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-muted);
}

.map-card__name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.map-card__meta {
  font-size: var(--text-xs);
  color: var(--color-accent);
  margin-bottom: var(--space-2);
}

.map-card__counts {
  display: flex;
  gap: var(--space-3);
}

.map-card__count {
  font-size: var(--text-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.map-card__count--obstacle {
  background-color: var(--color-error-muted);
  color: var(--color-error);
}

.map-card__count--waypoint {
  background-color: var(--color-warning-muted);
  color: var(--color-warning);
}

.map-card__actions {
  display: flex;
  gap: var(--space-2);
}

.map-card__render-badge {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  font-weight: var(--font-medium);
  margin-left: var(--space-2);
  vertical-align: middle;
}

.map-card__render-badge--dom {
  background-color: var(--color-success-muted);
  color: var(--color-success);
}

.map-card__render-badge--canvas {
  background-color: var(--color-info-muted);
  color: var(--color-info);
}

</style>
