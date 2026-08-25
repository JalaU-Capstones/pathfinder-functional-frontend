<template>
  <div class="base-input" :class="{ 'base-input--error': error }">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required"
            aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="base-input__field"
      v-bind="$attrs"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="base-input__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="base-input__hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
