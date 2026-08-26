<template>
  <div class="route-form">
    <div class="route-form__fields">
      <div class="route-form__field">
        <label class="route-form__label" for="map-select">
          Select Map
        </label>
        <select
          id="map-select"
          v-model="selectedMapId"
          class="route-form__select"
          @change="onMapChange"
        >
          <option value="" disabled>Choose a map...</option>
          <option
            v-for="map in maps"
            :key="map.id"
            :value="map.id"
          >
            {{ map.name }}
            ({{ map.dimensions.width }}x{{ map.dimensions.height }})
          </option>
        </select>
      </div>

      <div v-if="selectedMap" class="route-form__points">
        <div class="route-form__point-info">
          <span class="route-form__point-label">
            Start point:
          </span>
          <span
            class="route-form__point-value
              route-form__point-value--start font-mono"
          >
            {{
              startPoint
                ? `(${startPoint.x}, ${startPoint.y})`
                : 'Click a cell on the grid'
            }}
          </span>
        </div>
        <div class="route-form__point-info">
          <span class="route-form__point-label">
            End point:
          </span>
          <span
            class="route-form__point-value
              route-form__point-value--end font-mono"
          >
            {{
              endPoint
                ? `(${endPoint.x}, ${endPoint.y})`
                : 'Click a second cell on the grid'
            }}
          </span>
        </div>
        <p class="route-form__hint">
          Click once to set the start point.
          Click again to set the end point.
          Click a third time to reset.
        </p>
      </div>
    </div>

    <div v-if="selectedMap" class="route-form__grid-area">
      <MapGrid
        :map="selectedMap"
        :start-point="startPoint"
        :end-point="endPoint"
        :path="[]"
        :interactive="true"
        @cell-click="handleCellClick"
      />
    </div>

    <BaseAlert
      v-if="validationError"
      type="error"
      :message="validationError"
    />

    <div v-if="selectedMap" class="route-form__actions">
      <BaseButton
        variant="secondary"
        @click="resetPoints"
      >
        Reset Points
      </BaseButton>
      <BaseButton
        :loading="loading"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        Calculate Route
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import MapGrid from './MapGrid.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';

const props = defineProps({
  maps: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['submit']);

const selectedMapId = ref('');
const startPoint = ref(null);
const endPoint = ref(null);
const validationError = ref('');

/**
 * selectedMap — derived from selectedMapId.
 * Pure computed: no side effects.
 */
const selectedMap = computed(() =>
  props.maps.find((m) => m.id === selectedMapId.value) || null
);

const canSubmit = computed(
  () => startPoint.value !== null && endPoint.value !== null
);

const onMapChange = () => {
  startPoint.value = null;
  endPoint.value = null;
  validationError.value = '';
};

const resetPoints = () => {
  startPoint.value = null;
  endPoint.value = null;
  validationError.value = '';
};

/**
 * handleCellClick — manages the click state machine.
 * State transitions:
 *   no points      -> click -> set start
 *   start set      -> click -> set end (if different from start)
 *   both set       -> click -> reset and set new start
 */
const handleCellClick = ({ x, y }) => {
  validationError.value = '';

  if (!startPoint.value) {
    startPoint.value = { x, y };
    return;
  }

  if (!endPoint.value) {
    if (startPoint.value.x === x && startPoint.value.y === y) {
      validationError.value =
        'Start and end points cannot be the same cell.';
      return;
    }
    endPoint.value = { x, y };
    return;
  }

  // Both set — reset and start over
  startPoint.value = { x, y };
  endPoint.value = null;
};

const handleSubmit = () => {
  if (!canSubmit.value) return;
  emit('submit', {
    mapId: selectedMapId.value,
    start: startPoint.value,
    end: endPoint.value,
  });
};
</script>

<style scoped>
.route-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.route-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.route-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.route-form__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.route-form__select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
}

.route-form__select:focus {
  border-color: var(--color-accent);
}

.route-form__points {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.route-form__point-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.route-form__point-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  min-width: 80px;
}

.route-form__point-value {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.route-form__point-value--start {
  color: var(--grid-cell-start);
}

.route-form__point-value--end {
  color: var(--grid-cell-end);
}

.route-form__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.route-form__grid-area {
  overflow: auto;
}

.route-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
