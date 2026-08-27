<template>
  <div class="waypoint-form">
    <h3 class="waypoint-form__title">{{ editMode ? 'Edit Waypoint' : 'Add Waypoint' }}</h3>

    <BaseAlert
      v-if="error"
      type="error"
      :message="error"
    />

    <form class="waypoint-form__fields"
          @submit.prevent="handleSubmit">
      <div v-if="editMode" class="waypoint-form__field">
        <label class="waypoint-form__label">Map</label>
        <p class="waypoint-form__readonly font-mono">
          {{ selectedMap?.name || form.mapId }}
        </p>
      </div>

      <div v-else class="waypoint-form__field">
        <label class="waypoint-form__label"
               for="wp-map">
          Map
        </label>
        <select
          id="wp-map"
          v-model="form.mapId"
          class="waypoint-form__select"
          required
        >
          <option value="" disabled>Select a map...</option>
          <option
            v-for="map in maps"
            :key="map.id"
            :value="map.id"
          >
            {{ map.name }}
            ({{ map.dimensions.width }}x
            {{ map.dimensions.height }})
          </option>
        </select>
        <p v-if="errors.mapId"
           class="waypoint-form__error">
          {{ errors.mapId }}
        </p>
      </div>

      <BaseInput
        v-model="form.name"
        label="Waypoint Name"
        placeholder="Checkpoint Alpha"
        :error="errors.name"
        required
      />

      <div class="waypoint-form__row">
        <BaseInput
          v-model.number="form.x"
          label="Position X"
          type="number"
          placeholder="0"
          :hint="selectedMap
            ? `0 to ${selectedMap.dimensions.width - 1}`
            : ''"
          :error="errors.x"
          required
        />
        <BaseInput
          v-model.number="form.y"
          label="Position Y"
          type="number"
          placeholder="0"
          :hint="selectedMap
            ? `0 to ${selectedMap.dimensions.height - 1}`
            : ''"
          :error="errors.y"
          required
        />
      </div>

      <div class="waypoint-form__actions">
        <BaseButton
          v-if="editMode"
          variant="secondary"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </BaseButton>
        <BaseButton type="submit" :loading="loading">
          {{ editMode ? 'Save Changes' : 'Add Waypoint' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';

const props = defineProps({
  maps: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  initialData: { type: Object, default: null },
  editMode: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({ mapId: '', name: '', x: 0, y: 0 });
const errors = reactive({
  mapId: '', name: '', x: '', y: '',
});

watch(() => props.initialData, (data) => {
  if (data) {
    form.mapId = data.mapId || '';
    form.name = data.name || '';
    form.x = data.position?.x ?? 0;
    form.y = data.position?.y ?? 0;
  }
}, { immediate: true });

const selectedMap = computed(() =>
  props.maps.find((m) => m.id === form.mapId) || null
);

const validate = () => {
  errors.mapId = form.mapId ? '' : 'Please select a map.';
  errors.name = form.name.trim()
    ? '' : 'Waypoint name is required.';

  const maxX = selectedMap.value
    ? selectedMap.value.dimensions.width - 1 : Infinity;
  const maxY = selectedMap.value
    ? selectedMap.value.dimensions.height - 1 : Infinity;

  errors.x = (Number.isInteger(form.x) &&
    form.x >= 0 && form.x <= maxX)
    ? '' : `X must be between 0 and ${maxX}.`;
  errors.y = (Number.isInteger(form.y) &&
    form.y >= 0 && form.y <= maxY)
    ? '' : `Y must be between 0 and ${maxY}.`;

  return !errors.mapId && !errors.name &&
         !errors.x && !errors.y;
};

const handleSubmit = () => {
  if (!validate()) return;
  if (props.editMode) {
    emit('submit', {
      name: form.name.trim(),
      position: { x: Number(form.x), y: Number(form.y) },
      mapId: form.mapId,
    });
  } else {
    emit('submit', {
      mapId: form.mapId,
      position: { x: Number(form.x), y: Number(form.y) },
      name: form.name.trim(),
    });
  }
};
</script>

<style scoped>
.waypoint-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.waypoint-form__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.waypoint-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.waypoint-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.waypoint-form__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.waypoint-form__select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.waypoint-form__readonly {
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  opacity: 0.7;
}

.waypoint-form__select:focus {
  border-color: var(--color-accent);
}

.waypoint-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.waypoint-form__error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.waypoint-form__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
