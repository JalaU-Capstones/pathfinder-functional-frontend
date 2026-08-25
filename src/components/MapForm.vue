<template>
  <div class="map-form">
    <h3 class="map-form__title">Create Map</h3>

    <BaseAlert
      v-if="error"
      type="error"
      :message="error"
      dismissible
    />

    <form class="map-form__fields" @submit.prevent="handleSubmit">
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
          :hint="`Min 10, Max 10000`"
          required
          :error="errors.width"
        />
        <BaseInput
          v-model.number="form.height"
          label="Height"
          type="number"
          placeholder="100"
          :hint="`Min 10, Max 10000`"
          required
          :error="errors.height"
        />
      </div>

      <div class="map-form__actions">
        <BaseButton
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
          Create Map
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';

const emit = defineEmits(['submit', 'cancel']);

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

const form = reactive({
  name: '',
  width: 100,
  height: 100,
});

const errors = reactive({
  name: '',
  width: '',
  height: '',
});

/**
 * validate — pure validation function.
 * Returns true if all fields are valid.
 * Sets errors object as a side effect.
 */
const validate = () => {
  errors.name = form.name.trim()
    ? '' : 'Map name is required.';
  errors.width = (form.width >= 10 && form.width <= 10000)
    ? '' : 'Width must be between 10 and 10000.';
  errors.height = (form.height >= 10 && form.height <= 10000)
    ? '' : 'Height must be between 10 and 10000.';
  return !errors.name && !errors.width && !errors.height;
};

const handleSubmit = () => {
  if (!validate()) return;
  emit('submit', {
    name: form.name.trim(),
    dimensions: {
      width: Number(form.width),
      height: Number(form.height),
    },
  });
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

.map-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
</style>
