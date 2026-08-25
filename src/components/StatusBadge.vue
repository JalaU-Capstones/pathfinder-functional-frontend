<template>
  <span class="status-badge" :class="[`status-badge--${status}`, `status-badge--${size}`]">
    <span class="status-badge__dot" aria-hidden="true"></span>
    <span class="status-badge__label">{{ label }}</span>
  </span>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'checking',
    validator: (v) => ['online', 'offline', 'checking', 'error'].includes(v),
  },
  label: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['sm', 'md'].includes(v),
  },
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.status-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.status-badge--checking .status-badge__dot {
  background-color: var(--color-warning);
  animation: pulse 1.5s ease-in-out infinite;
}

.status-badge--online .status-badge__dot {
  background-color: var(--color-success);
}

.status-badge--offline .status-badge__dot,
.status-badge--error .status-badge__dot {
  background-color: var(--color-error);
}

.status-badge__label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.status-badge--md .status-badge__dot {
  width: 10px;
  height: 10px;
}

.status-badge--md .status-badge__label {
  font-size: var(--text-sm);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
</style>
