<template>
  <div class="zoom-controls" role="group"
       aria-label="Grid zoom controls">
    <button
      class="zoom-controls__btn"
      :disabled="zoomLevel <= MIN_ZOOM"
      aria-label="Zoom out"
      title="Zoom out (Ctrl + scroll down)"
      @click="$emit('zoom-out')"
    >
      -
    </button>
    <button
      class="zoom-controls__label"
      aria-label="Reset zoom"
      title="Click to reset zoom to 100%"
      @click="$emit('zoom-reset')"
    >
      {{ formattedZoom }}
    </button>
    <button
      class="zoom-controls__btn"
      :disabled="zoomLevel >= MAX_ZOOM"
      aria-label="Zoom in"
      title="Zoom in (Ctrl + scroll up)"
      @click="$emit('zoom-in')"
    >
      +
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100.0;

const props = defineProps({
  zoomLevel: { type: Number, required: true },
});

defineEmits(['zoom-in', 'zoom-out', 'zoom-reset']);

const formattedZoom = computed(() =>
  `${Math.round(props.zoomLevel * 100)}%`
);
</script>

<style scoped>
.zoom-controls {
  display: inline-flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-bg-surface-2);
  align-self: flex-start;
}

.zoom-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
  line-height: 1;
  font-family: var(--font-mono);
}

.zoom-controls__btn:hover:not(:disabled) {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
}

.zoom-controls__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-controls__label {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 28px;
  background: none;
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: var(--font-medium);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
  padding: 0 var(--space-2);
}

.zoom-controls__label:hover {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
}
</style>
