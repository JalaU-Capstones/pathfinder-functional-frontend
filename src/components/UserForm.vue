<template>
  <div class="user-form">
    <h3 class="user-form__title">
      {{ editMode ? 'Edit User' : 'Create User' }}
    </h3>

    <BaseAlert
      v-if="error"
      type="error"
      :message="error"
    />

    <form class="user-form__fields"
          @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.name"
        label="Full Name"
        placeholder="Diego Botina"
        :error="errors.name"
        required
      />
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="user@example.com"
        :error="errors.email"
        required
      />
      <BaseInput
        v-model.number="form.age"
        label="Age"
        type="number"
        placeholder="22"
        :error="errors.age"
        required
      />
      <div class="user-form__actions">
        <BaseButton
          v-if="editMode"
          variant="secondary"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </BaseButton>
        <BaseButton type="submit" :loading="loading">
          {{ editMode ? 'Save Changes' : 'Create User' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';

const props = defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  initialData: { type: Object, default: null },
  editMode: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

const form = reactive({ name: '', email: '', age: '' });
const errors = reactive({ name: '', email: '', age: '' });

watch(() => props.initialData, (data) => {
  if (data) {
    form.name = data.name || '';
    form.email = data.email || '';
    form.age = data.age || '';
  }
}, { immediate: true });

const validate = () => {
  errors.name = form.name.trim()
    ? '' : 'Name is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  errors.email = emailPattern.test(form.email)
    ? '' : 'Valid email is required.';
  errors.age = (Number.isInteger(Number(form.age)) &&
    Number(form.age) > 0)
    ? '' : 'Age must be a positive integer.';
  return !errors.name && !errors.email && !errors.age;
};

const handleSubmit = () => {
  if (!validate()) return;
  emit('submit', {
    name: form.name.trim(),
    email: form.email.trim(),
    age: Number(form.age),
  });
};
</script>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.user-form__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.user-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.user-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
}
</style>
