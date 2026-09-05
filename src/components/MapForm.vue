<template>
  <div class="map-form">
    <h3 class="map-form__title">
      {{ editMode ? 'Edit Map' : 'Create Map' }}
    </h3>

    <BaseAlert
      v-if="error"
      type="error"
      :message="error"
      dismissible
    />

    <form class="map-form__fields" @submit.prevent="handleSubmit">

      <!-- Section 1: Core fields (always visible) -->
      <BaseInput
        v-model="form.name"
        label="Map Name"
        placeholder="Level 1"
        required
        :error="errors.name"
      />

      <div class="map-form__row">
        <BaseInput
          v-model.number="form.width"
          label="Width"
          type="number"
          placeholder="100"
          hint="Min 10, Max 10000"
          required
          :error="errors.width"
        />
        <BaseInput
          v-model.number="form.height"
          label="Height"
          type="number"
          placeholder="100"
          hint="Min 10, Max 10000"
          required
          :error="errors.height"
        />
      </div>

      <!-- Section 2: Optional obstacles and waypoints -->
      <!-- Hidden in edit mode — obstacles/waypoints are
           managed separately in their own views -->
      <div v-if="!editMode"
           class="map-form__optional-section">
        <button
          type="button"
          class="map-form__toggle"
          :aria-expanded="showOptional.toString()"
          @click="showOptional = !showOptional"
        >
          <span
            class="map-form__toggle-icon"
            :class="{
              'map-form__toggle-icon--open': showOptional
            }"
          >
            &#9654;
          </span>
          <span class="map-form__toggle-label">
            Add obstacles and waypoints now (optional)
          </span>
          <span
            v-if="totalItems > 0"
            class="map-form__toggle-badge"
          >
            {{ totalItems }}
          </span>
        </button>

        <div v-if="showOptional"
             class="map-form__optional-body">

          <!-- Obstacles sub-section -->
          <div class="map-form__subsection">
            <h4 class="map-form__subsection-title">
              Obstacles
              <span class="map-form__subsection-count">
                {{ obstacleList.length }} / 50
              </span>
            </h4>

            <div
              class="map-form__item-builder"
              v-if="obstacleList.length < 50"
            >
              <div class="map-form__item-inputs map-form__item-inputs--obstacles">
                <BaseInput
                  v-model.number="newObstacle.startX"
                  label="Start X"
                  type="number"
                  placeholder="0"
                  :hint="dimensionsValid
                    ? `0-${form.width - 1}` : ''"
                />
                <BaseInput
                  v-model.number="newObstacle.startY"
                  label="Start Y"
                  type="number"
                  placeholder="0"
                  :hint="dimensionsValid
                    ? `0-${form.height - 1}` : ''"
                />
                <BaseInput
                  v-model="newObstacle.endX"
                  label="End X"
                  type="number"
                  placeholder="-"
                  hint="Optional"
                />
                <BaseInput
                  v-model="newObstacle.endY"
                  label="End Y"
                  type="number"
                  placeholder="-"
                  hint="Optional"
                />
              </div>
              <p v-if="obstacleError"
                 class="map-form__item-error">
                {{ obstacleError }}
              </p>
              <BaseButton
                variant="secondary"
                size="sm"
                type="button"
                @click="addObstacle"
              >
                Add Obstacle
              </BaseButton>
            </div>

            <p v-else class="map-form__limit-msg">
              Maximum of 50 obstacles reached for creation.
              Add more after the map is created.
            </p>

            <!-- Obstacle list -->
            <ul v-if="obstacleList.length > 0"
                class="map-form__item-list">
              <li
                v-for="(obs, index) in obstacleList"
                :key="`obs-${index}`"
                class="map-form__item-row"
              >
                <span class="map-form__item-label map-form__item-label--obstacle font-mono">
                  ({{ obs.startX }}, {{ obs.startY }}) to ({{ obs.endX }}, {{ obs.endY }})
                </span>
                <button
                  type="button"
                  class="map-form__item-remove"
                  :aria-label="`Remove obstacle`"
                  @click="removeObstacle(index)"
                >
                  x
                </button>
              </li>
            </ul>
          </div>

          <!-- Waypoints sub-section -->
          <div class="map-form__subsection">
            <h4 class="map-form__subsection-title">
              Waypoints
              <span class="map-form__subsection-count">
                {{ waypointList.length }} / 50
              </span>
            </h4>

            <div
              class="map-form__item-builder"
              v-if="waypointList.length < 50"
            >
              <div class="map-form__item-inputs">
                <BaseInput
                  v-model.number="newWaypoint.x"
                  label="X"
                  type="number"
                  placeholder="0"
                  :hint="dimensionsValid
                    ? `0-${form.width - 1}` : ''"
                />
                <BaseInput
                  v-model.number="newWaypoint.y"
                  label="Y"
                  type="number"
                  placeholder="0"
                  :hint="dimensionsValid
                    ? `0-${form.height - 1}` : ''"
                />
                <BaseInput
                  v-model="newWaypoint.name"
                  label="Name"
                  placeholder="Checkpoint A"
                />
              </div>
              <p v-if="waypointError"
                 class="map-form__item-error">
                {{ waypointError }}
              </p>
              <BaseButton
                variant="secondary"
                size="sm"
                type="button"
                @click="addWaypoint"
              >
                Add Waypoint
              </BaseButton>
            </div>

            <p v-else class="map-form__limit-msg">
              Maximum of 50 waypoints reached for creation.
              Add more after the map is created.
            </p>

            <!-- Waypoint list -->
            <ul v-if="waypointList.length > 0"
                class="map-form__item-list">
              <li
                v-for="(wp, index) in waypointList"
                :key="`wp-${index}`"
                class="map-form__item-row"
              >
                <span class="map-form__item-label map-form__item-label--waypoint font-mono">
                  {{ wp.name }}
                  ({{ wp.position.x }}, {{ wp.position.y }})
                </span>
                <button
                  type="button"
                  class="map-form__item-remove"
                  :aria-label="`Remove waypoint ${wp.name}`"
                  @click="removeWaypoint(index)"
                >
                  x
                </button>
              </li>
            </ul>
          </div>

          <!-- Mini grid preview -->
          <div class="map-form__preview">
            <BaseButton
              v-if="!showPreview"
              type="button"
              variant="secondary"
              size="sm"
              @click="enableInteractivePreview"
            >
              Click on grid to place
            </BaseButton>
            <div v-if="showPreview">
              <p class="map-form__preview-label">
                Preview (Click and drag to add obstacles)
              </p>
              <MapGrid 
                :map="previewMap" 
                interactive 
                @cell-click="handleGridClick" 
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Form actions -->
      <div class="map-form__actions">
        <BaseButton
          v-if="editMode"
          variant="secondary"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="loading"
        >
          {{ editMode ? 'Save Changes' : 'Create Map' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';
import MapGrid from './MapGrid.vue';

// ─── Props and emits ─────────────────────────────────────────

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  initialData: { type: Object, default: null },
  editMode: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

// ─── Core form state ─────────────────────────────────────────

const form = reactive({ name: '', width: 100, height: 100 });
const errors = reactive({ name: '', width: '', height: '' });

// ─── Optional section state ───────────────────────────────────

const showOptional = ref(false);
const obstacleList = ref([]);
const waypointList = ref([]);

/** State for the "add obstacle" mini-form */
const newObstacle = reactive({ startX: 0, startY: 0, endX: '', endY: '' });
const obstacleError = ref('');

/** State for the "add waypoint" mini-form */
const newWaypoint = reactive({ x: 0, y: 0, name: '' });
const waypointError = ref('');

// ─── Computed ─────────────────────────────────────────────────

const totalItems = computed(
  () => obstacleList.value.length + waypointList.value.length
);

/**
 * dimensionsValid — true when width and height are
 * within the accepted range. Used to show coordinate
 * hints and validate obstacle/waypoint positions.
 */
const dimensionsValid = computed(
  () =>
    Number.isInteger(form.width) &&
    form.width >= 10 &&
    form.width <= 10000 &&
    Number.isInteger(form.height) &&
    form.height >= 10 &&
    form.height <= 10000
);

/**
 * previewMap — synthetic map object fed to MapGrid.
 * Built from form state + obstacleList + waypointList.
 * Allows MapGrid to render the in-progress configuration
 * before the map is saved to the backend.
 */
const previewMap = computed(() => ({
  dimensions: {
    width: dimensionsValid.value ? form.width : 10,
    height: dimensionsValid.value ? form.height : 10,
  },
  obstacles: obstacleList.value.map((o) => ({
    startX: o.startX,
    startY: o.startY,
    endX: o.endX,
    endY: o.endY,
  })),
  waypoints: waypointList.value.map((w) => ({
    position: w.position,
    name: w.name,
  })),
}));

const isInteractivePreviewEnabled = ref(false);

const enableInteractivePreview = () => {
  isInteractivePreviewEnabled.value = true;
};

/**
 * showPreview — show the grid preview only when there
 * is something to preview and dimensions are valid.
 */
const showPreview = computed(
  () =>
    dimensionsValid.value &&
    (isInteractivePreviewEnabled.value ||
     obstacleList.value.length > 0 ||
     waypointList.value.length > 0)
);

const handleGridClick = (coords) => {
  if (obstacleList.value.length >= 50) return;
  // Duplicate check
  const duplicate = obstacleList.value.some(
    (o) => o.startX === coords.startX && o.startY === coords.startY && o.endX === coords.endX && o.endY === coords.endY
  );
  if (duplicate) return;
  
  obstacleList.value = [
    ...obstacleList.value,
    {
      startX: coords.startX,
      startY: coords.startY,
      endX: coords.endX,
      endY: coords.endY,
    },
  ];
};

// ─── Watch initialData for edit mode pre-fill ─────────────────

watch(
  () => props.initialData,
  (data) => {
    if (data) {
      form.name = data.name || '';
      form.width = data.dimensions?.width || 100;
      form.height = data.dimensions?.height || 100;
    }
  },
  { immediate: true }
);

// ─── Core form validation ─────────────────────────────────────

/**
 * validate — validates the core form fields.
 * Returns true if all required fields are valid.
 * Populates the errors object as a side effect.
 */
const validate = () => {
  errors.name = form.name.trim()
    ? '' : 'Map name is required.';
  errors.width =
    Number.isInteger(Number(form.width)) &&
    form.width >= 10 &&
    form.width <= 10000
      ? '' : 'Width must be between 10 and 10000.';
  errors.height =
    Number.isInteger(Number(form.height)) &&
    form.height >= 10 &&
    form.height <= 10000
      ? '' : 'Height must be between 10 and 10000.';
  return !errors.name && !errors.width && !errors.height;
};

// ─── Obstacle builder functions ───────────────────────────────

/**
 * validateObstacleInput — validates the newObstacle form.
 * Returns true if the obstacle can be added to the list.
 */
const validateObstacleInput = () => {
  const maxX = dimensionsValid.value ? form.width - 1 : Infinity;
  const maxY = dimensionsValid.value ? form.height - 1 : Infinity;

  const sx = Number(newObstacle.startX);
  const sy = Number(newObstacle.startY);
  const ex = newObstacle.endX !== '' ? Number(newObstacle.endX) : sx;
  const ey = newObstacle.endY !== '' ? Number(newObstacle.endY) : sy;

  if (!Number.isInteger(sx) || sx < 0 || sx > maxX) {
    obstacleError.value = `Start X must be between 0 and ${maxX}.`;
    return false;
  }
  if (!Number.isInteger(sy) || sy < 0 || sy > maxY) {
    obstacleError.value = `Start Y must be between 0 and ${maxY}.`;
    return false;
  }
  if (!Number.isInteger(ex) || ex < 0 || ex > maxX || ex < sx) {
    obstacleError.value = `End X must be between ${sx} and ${maxX}.`;
    return false;
  }
  if (!Number.isInteger(ey) || ey < 0 || ey > maxY || ey < sy) {
    obstacleError.value = `End Y must be between ${sy} and ${maxY}.`;
    return false;
  }

  // Duplicate check: same position already in list
  const key = `${sx},${sy},${ex},${ey}`;
  const duplicate = obstacleList.value.some(
    (o) => `${o.startX},${o.startY},${o.endX},${o.endY}` === key
  );
  if (duplicate) {
    obstacleError.value = 'This obstacle is already added.';
    return false;
  }

  obstacleError.value = '';
  return true;
};

/**
 * addObstacle — validates and appends a new obstacle
 * to obstacleList. Resets the mini-form on success.
 */
const addObstacle = () => {
  if (!validateObstacleInput()) return;
  const sx = Number(newObstacle.startX);
  const sy = Number(newObstacle.startY);
  const ex = newObstacle.endX !== '' ? Number(newObstacle.endX) : sx;
  const ey = newObstacle.endY !== '' ? Number(newObstacle.endY) : sy;
  
  obstacleList.value = [
    ...obstacleList.value,
    {
      startX: sx,
      startY: sy,
      endX: ex,
      endY: ey,
    },
  ];
  // Reset mini-form
  newObstacle.startX = 0;
  newObstacle.startY = 0;
  newObstacle.endX = '';
  newObstacle.endY = '';
};

/**
 * removeObstacle — removes an obstacle from the list
 * by index. Returns a new array (no mutation).
 */
const removeObstacle = (index) => {
  obstacleList.value = obstacleList.value.filter(
    (_, i) => i !== index
  );
};

// ─── Waypoint builder functions ───────────────────────────────

/**
 * validateWaypointInput — validates the newWaypoint form.
 */
const validateWaypointInput = () => {
  const maxX = dimensionsValid.value ? form.width - 1 : Infinity;
  const maxY = dimensionsValid.value ? form.height - 1 : Infinity;

  if (!Number.isInteger(Number(newWaypoint.x)) ||
      newWaypoint.x < 0 || newWaypoint.x > maxX) {
    waypointError.value =
      `X must be between 0 and ${maxX}.`;
    return false;
  }
  if (!Number.isInteger(Number(newWaypoint.y)) ||
      newWaypoint.y < 0 || newWaypoint.y > maxY) {
    waypointError.value =
      `Y must be between 0 and ${maxY}.`;
    return false;
  }
  if (!newWaypoint.name.trim()) {
    waypointError.value = 'Waypoint name is required.';
    return false;
  }

  // Duplicate position check
  const key = `${newWaypoint.x},${newWaypoint.y}`;
  const duplicate = waypointList.value.some(
    (w) => `${w.position.x},${w.position.y}` === key
  );
  if (duplicate) {
    waypointError.value =
      'A waypoint at this position is already added.';
    return false;
  }

  waypointError.value = '';
  return true;
};

/**
 * addWaypoint — validates and appends a new waypoint.
 */
const addWaypoint = () => {
  if (!validateWaypointInput()) return;
  waypointList.value = [
    ...waypointList.value,
    {
      name: newWaypoint.name.trim(),
      position: {
        x: Number(newWaypoint.x),
        y: Number(newWaypoint.y),
      },
    },
  ];
  newWaypoint.x = 0;
  newWaypoint.y = 0;
  newWaypoint.name = '';
};

/**
 * removeWaypoint — removes a waypoint by index.
 */
const removeWaypoint = (index) => {
  waypointList.value = waypointList.value.filter(
    (_, i) => i !== index
  );
};

// ─── Form submission ──────────────────────────────────────────

/**
 * handleSubmit — validates core fields and emits the
 * complete payload. In create mode, includes obstacles
 * and waypoints if any were added. In edit mode, only
 * core fields are included (obstacles/waypoints cannot
 * be changed via the map edit form).
 */
const handleSubmit = () => {
  if (!validate()) return;

  const payload = {
    name: form.name.trim(),
    dimensions: {
      width: Number(form.width),
      height: Number(form.height),
    }
  };

  if (!props.editMode) {
    if (obstacleList.value.length > 0) {
      payload.obstacles = obstacleList.value.map(obs => ({
        startX: Number(obs.startX),
        startY: Number(obs.startY),
        endX: obs.endX !== '' ? Number(obs.endX) : Number(obs.startX),
        endY: obs.endY !== '' ? Number(obs.endY) : Number(obs.startY)
      }));
    }
    if (waypointList.value.length > 0) {
      payload.waypoints = waypointList.value.map(wp => ({
        name: wp.name,
        position: wp.position
      }));
    }
  }

  emit('submit', payload);
};
</script>

<style scoped>
.map-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.map-form__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.map-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.map-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

/* Optional section */
.map-form__optional-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.map-form__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg-surface-2);
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: background-color var(--transition-fast);
}

.map-form__toggle:hover {
  background-color: var(--color-bg-surface-3);
  color: var(--color-text-primary);
}

.map-form__toggle-icon {
  display: inline-block;
  font-size: var(--text-xs);
  transition: transform var(--transition-fast);
  line-height: 1;
}

.map-form__toggle-icon--open {
  transform: rotate(90deg);
}

.map-form__toggle-label {
  flex-grow: 1;
  font-weight: var(--font-medium);
}

.map-form__toggle-badge {
  background-color: var(--color-accent);
  color: var(--color-bg-base);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

.map-form__optional-body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  border-top: 1px solid var(--color-border);
}

/* Sub-sections */
.map-form__subsection {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.map-form__subsection-title {
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-xs);
}

.map-form__subsection-count {
  font-weight: var(--font-regular);
  color: var(--color-text-muted);
  text-transform: none;
  letter-spacing: 0;
}

/* Item builder */
.map-form__item-builder {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.map-form__item-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.map-form__item-error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.map-form__limit-msg {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Item list */
.map-form__item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-height: 150px;
  overflow-y: auto;
  padding: var(--space-2);
  background-color: var(--color-bg-surface-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.map-form__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.map-form__item-row:hover {
  background-color: var(--color-bg-surface-3);
}

.map-form__item-label {
  font-size: var(--text-xs);
  flex-grow: 1;
}

.map-form__item-label--obstacle {
  color: var(--grid-cell-obstacle);
}

.map-form__item-label--waypoint {
  color: var(--grid-cell-waypoint);
}

.map-form__item-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1;
  padding: 0 var(--space-1);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.map-form__item-remove:hover {
  color: var(--color-error);
}

/* Mini preview */
.map-form__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.map-form__preview-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Form actions */
.map-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
</style>
