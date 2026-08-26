<template>
  <div
    class="route-card"
    :class="{ 'route-card--selected': selected }"
    role="button"
    tabindex="0"
    @click="$emit('select', route)"
    @keydown.enter="$emit('select', route)"
  >
    <div class="route-card__body">
      <div class="route-card__coords font-mono">
        <span class="route-card__coord--start">
          ({{ route.start.x }}, {{ route.start.y }})
        </span>
        <span class="route-card__arrow">to</span>
        <span class="route-card__coord--end">
          ({{ route.end.x }}, {{ route.end.y }})
        </span>
      </div>
      <div class="route-card__meta">
        <span class="route-card__distance font-mono">
          {{ route.distance }} steps
        </span>
        <span class="route-card__cells font-mono">
          {{ route.optimal_path?.length ?? 0 }} cells
        </span>
      </div>
    </div>
    <BaseButton
      variant="danger"
      size="sm"
      @click.stop="$emit('delete', route)"
      aria-label="Delete route"
    >
      Delete
    </BaseButton>
  </div>
</template>

<script setup>
import BaseButton from './BaseButton.vue';

defineProps({
  route: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select', 'delete']);
</script>

<style scoped>
.route-card {
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

.route-card:hover {
  border-color: var(--color-accent);
}

.route-card--selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-muted);
}

.route-card__coords {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.route-card__coord--start {
  color: var(--grid-cell-start);
  font-weight: var(--font-medium);
}

.route-card__arrow {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.route-card__coord--end {
  color: var(--grid-cell-end);
  font-weight: var(--font-medium);
}

.route-card__meta {
  display: flex;
  gap: var(--space-4);
}

.route-card__distance {
  font-size: var(--text-xs);
  color: var(--color-accent);
}

.route-card__cells {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
