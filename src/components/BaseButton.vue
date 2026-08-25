<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--loading': loading }
    ]"
    v-bind="$attrs"
  >
    <span v-if="loading" class="base-button__spinner"
          aria-hidden="true"></span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary','secondary','danger','ghost'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm','md','lg'].includes(v),
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
});
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    opacity var(--transition-fast);
  white-space: nowrap;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.base-button--sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}
.base-button--md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}
.base-button--lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}

/* Variants */
.base-button--primary {
  background-color: var(--color-accent);
  color: var(--color-bg-base);
  border-color: var(--color-accent);
}
.base-button--primary:hover:not(:disabled) {
  background-color: var(--color-accent-light);
  border-color: var(--color-accent-light);
}

.base-button--secondary {
  background-color: var(--color-bg-surface-2);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
.base-button--secondary:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.base-button--danger {
  background-color: transparent;
  color: var(--color-error);
  border-color: var(--color-error);
}
.base-button--danger:hover:not(:disabled) {
  background-color: var(--color-error-muted);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}
.base-button--ghost:hover:not(:disabled) {
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface-2);
}

/* Loading spinner */
.base-button__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
