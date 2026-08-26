<template>
  <div class="obstacle-form">
    <h3 class="obstacle-form__title">Add Obstacle</h3>

    <BaseAlert
      v-if="error"
      type="error"
      :message="error"
    />

    <form class="obstacle-form__fields"
          @submit.prevent="handleSubmit">
      <div class="obstacle-form__field">
        <label class="obstacle-form__label"
               for="obs-map">
          Map
        </label>
        <select
          id="obs-map"
          v-model="form.mapId"
          class="obstacle-form__select"
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
           class="obstacle-form__error">
          {{ errors.mapId }}
        </p>
      </div>

      <div class="obstacle-form__row">
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
        <BaseInput
          v-model.number="form.size"
          label="Size"
          type="number"
          placeholder="1"
          hint="Positive integer"
          :error="errors.size"
          required
        />
      </div>

      <div class="obstacle-form__actions">
        <BaseButton type="submit" :loading="loading">
          Add Obstacle
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';

const props = defineProps({
  maps: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

const emit = defineEmits(['submit']);

const form = reactive({ mapId: '', x: 0, y: 0, size: 1 });
const errors = reactive({ mapId: '', x: '', y: '', size: '' });

const selectedMap = computed(() =>
  props.maps.find((m) => m.id === form.mapId) || null
);

const validate = () => {
  errors.mapId = form.mapId ? '' : 'Please select a map.';

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
  errors.size = (Number.isInteger(form.size) &&
    form.size >= 1)
    ? '' : 'Size must be a positive integer.';

  return !errors.mapId && !errors.x &&
         !errors.y && !errors.size;
};

const handleSubmit = () => {
  if (!validate()) return;
  emit('submit', {
    mapId: form.mapId,
    position: { x: Number(form.x), y: Number(form.y) },
    size: Number(form.size),
  });
};
</script>

<style scoped>
.obstacle-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.obstacle-form__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.obstacle-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.obstacle-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.obstacle-form__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.obstacle-form__select {
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

.obstacle-form__select:focus {
  border-color: var(--color-accent);
}

.obstacle-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
}

.obstacle-form__error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.obstacle-form__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
