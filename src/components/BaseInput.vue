<template>
  <div class="base-input" :class="{ 'base-input--error': error }">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required"
            aria-hidden="true">*</span>
    </label>
    <div class="base-input__field-wrapper">
      <input
        :id="inputId"
        :type="actualType"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="base-input__field"
        :class="{ 'base-input__field--with-toggle': type === 'password' }"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="base-input__toggle"
        @click="showPassword = !showPassword"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
      >
        <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
      </button>
    </div>
    <p v-if="error" class="base-input__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="base-input__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);

const showPassword = ref(false);

const actualType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

// Reset toggle when modelValue is cleared (e.g., form reset or tab switch)
watch(() => props.modelValue, (newVal) => {
  if (!newVal && props.type === 'password') {
    showPassword.value = false;
  }
});

const inputId = computed(() =>
  `input-${props.label.toLowerCase().replace(/\s+/g, '-')
    || Math.random().toString(36).slice(2)}`
);
</script>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-input__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.base-input__required {
  color: var(--color-error);
  margin-left: var(--space-1);
}

.base-input__field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input__field {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  outline: none;
}

.base-input__field--with-toggle {
  padding-right: 2.5rem;
}

.base-input__toggle {
  position: absolute;
  right: var(--space-2);
  background: transparent;
  border: none;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.base-input__toggle:hover {
  color: var(--color-text-primary);
}

.base-input__toggle:focus {
  outline: none;
  color: var(--color-accent);
}

.base-input__field::placeholder {
  color: var(--color-text-muted);
}

.base-input__field:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-muted);
}

.base-input__field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-input--error .base-input__field {
  border-color: var(--color-error);
}

.base-input--error .base-input__field:focus {
  box-shadow: 0 0 0 3px var(--color-error-muted);
}

.base-input__error {
  font-size: var(--text-xs);
  color: var(--color-error);
}

.base-input__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
