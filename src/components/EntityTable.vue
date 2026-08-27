<template>
  <div class="entity-table">
    <div v-if="loading" class="entity-table__state">
      <p class="text-secondary">Loading...</p>
    </div>

    <div v-else-if="rows.length === 0"
         class="entity-table__state">
      <p class="text-secondary">{{ emptyMessage }}</p>
    </div>

    <table v-else class="entity-table__table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="entity-table__th"
          >
            {{ col.label }}
          </th>
          <th class="entity-table__th
            entity-table__th--actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="entity-table__tr"
          :class="{
            'entity-table__tr--selected':
              selectedId === row.id
          }"
          @click="$emit('select', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="entity-table__td"
            :class="{
              'entity-table__td--mono': col.mono
            }"
          >
            {{ getCellValue(row, col.key) }}
          </td>
          <td class="entity-table__td
            entity-table__td--actions">
            <BaseButton
              variant="secondary"
              size="sm"
              @click.stop="$emit('edit', row)"
            >
              Edit
            </BaseButton>
            <BaseButton
              variant="danger"
              size="sm"
              @click.stop="$emit('delete', row)"
            >
              Delete
            </BaseButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import BaseButton from './BaseButton.vue';

defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: {
    type: String,
    default: 'No records found.',
  },
  selectedId: { type: String, default: null },
});

defineEmits(['select', 'delete', 'edit']);

/**
 * getCellValue — resolves nested keys using dot notation.
 * Allows column key like "position.x" to access
 * row.position.x cleanly.
 *
 * @param {Object} row
 * @param {string} key - Dot-notation key path
 * @returns {*} Cell display value
 */
const getCellValue = (row, key) =>
  key.split('.').reduce(
    (obj, k) => (obj != null ? obj[k] : ''),
    row
  );
</script>

<style scoped>
.entity-table {
  width: 100%;
  overflow-x: auto;
  max-width: 100%;
  box-sizing: border-box;
}

.entity-table__state {
  padding: var(--space-8);
  text-align: center;
}

.entity-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.entity-table__th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.entity-table__th--actions {
  text-align: right;
}

.entity-table__tr {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.entity-table__tr:hover {
  background-color: var(--color-bg-surface-2);
}

.entity-table__tr--selected {
  background-color: var(--color-accent-muted);
}

.entity-table__td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-table__td--mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-primary);
}

.entity-table__td--actions {
  text-align: right;
  white-space: nowrap;
}

.entity-table__td--actions > * + * {
  margin-left: var(--space-2);
}
</style>
