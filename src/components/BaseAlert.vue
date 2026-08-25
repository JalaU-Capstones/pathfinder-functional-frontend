<template>
  <div
    v-if="visible"
    class="base-alert"
    :class="`base-alert--${type}`"
    role="alert"
  >
    <span class="base-alert__message">{{ message }}</span>
    <button
      v-if="dismissible"
      class="base-alert__dismiss"
      aria-label="Dismiss"
      @click="visible = false"
    >
      x
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) =>
      ['success','error','warning','info'].includes(v),
  },
  message: { type: String, required: true },
  dismissible: { type: Boolean, default: false },
});

const visible = ref(true);
</script>

<style scoped>
.base-alert {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid;
  font-size: var(--text-sm);
}

.base-alert--info {
  background-color: var(--color-info-muted);
  border-color: var(--color-info);
  color: var(--color-info);
}
.base-alert--success {
  background-color: var(--color-success-muted);
  border-color: var(--color-success);
  color: var(--color-success);
}
.base-alert--warning {
  background-color: var(--color-warning-muted);
  border-color: var(--color-warning);
  color: var(--color-warning);
}
.base-alert--error {
  background-color: var(--color-error-muted);
  border-color: var(--color-error);
  color: var(--color-error);
}

.base-alert__message {
  flex-grow: 1;
  line-height: 1.5;
}

.base-alert__dismiss {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: var(--text-base);
  line-height: 1;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;
}
.base-alert__dismiss:hover { opacity: 1; }
</style>
