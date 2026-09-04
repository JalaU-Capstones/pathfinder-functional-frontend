<template>
  <AppLayout>
    <div class="stats-view">
      <div class="stats-view__header">
        <h1 class="stats-view__title">API Statistics</h1>
        <div class="stats-view__header-actions">
          <p class="stats-view__subtitle text-secondary">
            Live usage data collected by the tracking
            middleware on all /api/* requests.
          </p>
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="refreshing"
            @click="refreshAll"
          >
            Refresh
          </BaseButton>
        </div>
      </div>

      <BaseAlert
        v-if="globalError"
        type="error"
        :message="globalError"
        dismissible
      />

      <!-- Summary row -->
      <div class="stats-view__summary">
        <div class="stats-view__summary-card">
          <span class="stats-view__summary-label">
            Total Requests
          </span>
          <span class="stats-view__summary-value
            font-mono">
            {{ loading ? '...' : requestStats?.total_requests ?? 0 }}
          </span>
        </div>
        <div class="stats-view__summary-card">
          <span class="stats-view__summary-label">
            Endpoints Tracked
          </span>
          <span class="stats-view__summary-value
            font-mono">
            {{ loading ? '...' : endpointCount }}
          </span>
        </div>
        <div class="stats-view__summary-card">
          <span class="stats-view__summary-label">
            Most Popular
          </span>
          <span class="stats-view__summary-value font-mono
            stats-view__summary-value--accent">
            {{ loading ? '...' :
              popularStats?.most_popular || 'None yet' }}
          </span>
        </div>
        <div class="stats-view__summary-card">
          <span class="stats-view__summary-label">
            Success Rate
          </span>
          <span class="stats-view__summary-value font-mono"
            :class="successRateClass">
            {{ loading ? '...' : successRate }}
          </span>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="stats-view__loading">
        <p class="text-secondary">Loading statistics...</p>
      </div>

      <template v-else>
        <!-- Popular endpoints -->
        <div class="stats-view__panel">
          <h2 class="stats-view__panel-title">
            Endpoint Activity
          </h2>
          <div v-if="!popularStats?.ranked?.length"
               class="stats-view__empty">
            <p class="text-secondary">
              No requests tracked yet. Make some API calls
              and refresh.
            </p>
          </div>
          <div v-else class="stats-view__bar-chart">
            <div
              v-for="item in popularStats.ranked"
              :key="item.endpoint"
              class="stats-view__bar-row"
            >
              <span class="stats-view__bar-label font-mono">
                {{ item.endpoint }}
              </span>
              <div class="stats-view__bar-track">
                <div
                  class="stats-view__bar-fill"
                  :style="{
                    width: barWidth(
                      item.request_count,
                      popularStats.request_count
                    )
                  }"
                />
              </div>
              <span class="stats-view__bar-count font-mono">
                {{ item.request_count }}
              </span>
            </div>
          </div>
        </div>

        <!-- Request breakdown -->
        <div class="stats-view__panel">
          <h2 class="stats-view__panel-title">
            Requests by Method
          </h2>
          <div v-if="!hasBreakdown"
               class="stats-view__empty">
            <p class="text-secondary">No data yet.</p>
          </div>
          <table v-else class="stats-view__table">
            <thead>
              <tr>
                <th class="stats-view__th">Endpoint</th>
                <th
                  v-for="method in allMethods"
                  :key="method"
                  class="stats-view__th stats-view__th--method"
                >
                  <span
                    class="stats-view__method-badge"
                    :class="`stats-view__method-badge--${method.toLowerCase()}`"
                  >
                    {{ method }}
                  </span>
                </th>
                <th class="stats-view__th">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(methods, endpoint) in requestStats.breakdown"
                :key="endpoint"
                class="stats-view__tr"
              >
                <td class="stats-view__td font-mono">
                  {{ endpoint }}
                </td>
                <td
                  v-for="method in allMethods"
                  :key="method"
                  class="stats-view__td stats-view__td--center
                    font-mono"
                >
                  {{ methods[method] || 0 }}
                </td>
                <td class="stats-view__td stats-view__td--center
                  font-mono stats-view__td--total">
                  {{ Object.values(methods)
                    .reduce((a, b) => a + b, 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Two-column row: response times + status codes -->
        <div class="stats-view__two-col">
          <!-- Response times -->
          <div class="stats-view__panel">
            <h2 class="stats-view__panel-title">
              Response Times (ms)
            </h2>
            <div v-if="!hasResponseTimes"
                 class="stats-view__empty">
              <p class="text-secondary">No data yet.</p>
            </div>
            <table v-else class="stats-view__table">
              <thead>
                <tr>
                  <th class="stats-view__th">Endpoint</th>
                  <th class="stats-view__th
                    stats-view__th--method">Avg</th>
                  <th class="stats-view__th
                    stats-view__th--method">Min</th>
                  <th class="stats-view__th
                    stats-view__th--method">Max</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(times, endpoint) in responseTimeStats"
                  :key="endpoint"
                  class="stats-view__tr"
                >
                  <td class="stats-view__td font-mono">
                    {{ endpoint }}
                  </td>
                  <td class="stats-view__td
                    stats-view__td--center font-mono
                    text-accent">
                    {{ times.avg }}
                  </td>
                  <td class="stats-view__td
                    stats-view__td--center font-mono
                    text-success">
                    {{ times.min }}
                  </td>
                  <td class="stats-view__td
                    stats-view__td--center font-mono
                    text-warning">
                    {{ times.max }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Status codes -->
          <div class="stats-view__panel">
            <h2 class="stats-view__panel-title">
              Status Codes
            </h2>
            <div v-if="!hasStatusCodes"
                 class="stats-view__empty">
              <p class="text-secondary">No data yet.</p>
            </div>
            <div v-else class="stats-view__status-grid">
              <div
                v-for="(count, code) in statusCodeStats"
                :key="code"
                class="stats-view__status-card"
                :class="statusCardClass(Number(code))"
              >
                <span class="stats-view__status-code
                  font-mono">
                  {{ code }}
                </span>
                <span class="stats-view__status-count
                  font-mono">
                  {{ count }}
                </span>
                <span class="stats-view__status-label">
                  {{ statusLabel(Number(code)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import {
  getRequestStats,
  getResponseTimeStats,
  getStatusCodeStats,
  getPopularEndpoints,
} from '@/api/stats.js';

// ─── State ────────────────────────────────────────────────────

const loading = ref(false);
const refreshing = ref(false);
const globalError = ref('');
const requestStats = ref(null);
const responseTimeStats = ref(null);
const statusCodeStats = ref(null);
const popularStats = ref(null);

// ─── Computed ─────────────────────────────────────────────────

const endpointCount = computed(() => {
  if (!requestStats.value?.breakdown) return 0;
  return Object.keys(requestStats.value.breakdown).length;
});

/**
 * allMethods — sorted list of all HTTP methods seen
 * across all endpoints in the breakdown.
 */
const allMethods = computed(() => {
  if (!requestStats.value?.breakdown) return [];
  const methods = new Set();
  Object.values(requestStats.value.breakdown).forEach(
    (methodMap) => Object.keys(methodMap).forEach(
      (m) => methods.add(m)
    )
  );
  return ['GET', 'POST', 'PUT', 'DELETE'].filter(
    (m) => methods.has(m)
  );
});

const hasBreakdown = computed(() =>
  requestStats.value?.breakdown &&
  Object.keys(requestStats.value.breakdown).length > 0
);

const hasResponseTimes = computed(() =>
  responseTimeStats.value &&
  Object.keys(responseTimeStats.value).length > 0
);

const hasStatusCodes = computed(() =>
  statusCodeStats.value &&
  Object.keys(statusCodeStats.value).length > 0
);

/**
 * successRate — percentage of 2xx responses.
 */
const successRate = computed(() => {
  if (!statusCodeStats.value) return 'N/A';
  const entries = Object.entries(statusCodeStats.value);
  if (entries.length === 0) return 'N/A';
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const success = entries
    .filter(([code]) => Number(code) >= 200 &&
      Number(code) < 300)
    .reduce((s, [, c]) => s + c, 0);
  if (total === 0) return 'N/A';
  return `${Math.round((success / total) * 100)}%`;
});

const successRateClass = computed(() => {
  const rate = parseInt(successRate.value);
  if (isNaN(rate)) return '';
  if (rate >= 90) return 'text-success';
  if (rate >= 70) return 'text-warning';
  return 'text-error';
});

// ─── Pure helpers ─────────────────────────────────────────────

/**
 * barWidth — computes the CSS width percentage for a
 * bar in the popularity chart.
 */
const barWidth = (count, maxCount) => {
  if (!maxCount) return '0%';
  return `${Math.round((count / maxCount) * 100)}%`;
};

/**
 * statusLabel — returns a short description for common
 * HTTP status codes.
 */
const statusLabel = (code) => {
  const labels = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    400: 'Bad Request', 401: 'Unauthorized',
    403: 'Forbidden', 404: 'Not Found',
    409: 'Conflict', 422: 'Unprocessable',
    500: 'Server Error',
  };
  return labels[code] || 'Other';
};

/**
 * statusCardClass — CSS modifier class based on status
 * code range.
 */
const statusCardClass = (code) => {
  if (code >= 200 && code < 300) return 'stats-view__status-card--success';
  if (code >= 400 && code < 500) return 'stats-view__status-card--warning';
  if (code >= 500) return 'stats-view__status-card--error';
  return '';
};

// ─── Data fetching ────────────────────────────────────────────

const fetchAll = async (isRefresh = false) => {
  if (isRefresh) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }
  globalError.value = '';
  try {
    const [req, resp, status, popular] = await Promise.all([
      getRequestStats(),
      getResponseTimeStats(),
      getStatusCodeStats(),
      getPopularEndpoints(),
    ]);
    requestStats.value = req;
    responseTimeStats.value = resp;
    statusCodeStats.value = status;
    popularStats.value = popular;
  } catch (err) {
    globalError.value = err.message ||
      'Failed to load statistics.';
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const refreshAll = () => fetchAll(true);

onMounted(() => fetchAll());
</script>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.stats-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stats-view__header-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.stats-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

/* Summary cards row */
.stats-view__summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.stats-view__summary-card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stats-view__summary-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: var(--font-semibold);
}

.stats-view__summary-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.stats-view__summary-value--accent {
  font-size: var(--text-sm);
  color: var(--color-accent);
}

/* Loading and empty */
.stats-view__loading,
.stats-view__empty {
  padding: var(--space-6);
  text-align: center;
}

/* Panels */
.stats-view__panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stats-view__panel-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

/* Two-column layout */
.stats-view__two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: start;
}

@media (max-width: 900px) {
  .stats-view__two-col {
    grid-template-columns: 1fr;
  }
}

/* Bar chart */
.stats-view__bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stats-view__bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 200px) 1fr 50px;
  align-items: center;
  gap: var(--space-3);
}

.stats-view__bar-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-view__bar-track {
  height: 8px;
  background-color: var(--color-bg-surface-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stats-view__bar-fill {
  height: 100%;
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.stats-view__bar-count {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-align: right;
}

/* Tables */
.stats-view__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.stats-view__th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.stats-view__th--method {
  text-align: center;
}

.stats-view__tr:hover {
  background-color: var(--color-bg-surface-2);
}

.stats-view__td {
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-xs);
}

.stats-view__td--center {
  text-align: center;
}

.stats-view__td--total {
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

/* Method badges */
.stats-view__method-badge {
  display: inline-block;
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: var(--font-semibold);
}

.stats-view__method-badge--get {
  background-color: var(--color-success-muted);
  color: var(--color-success);
}

.stats-view__method-badge--post {
  background-color: var(--color-info-muted);
  color: var(--color-info);
}

.stats-view__method-badge--put {
  background-color: var(--color-warning-muted);
  color: var(--color-warning);
}

.stats-view__method-badge--delete {
  background-color: var(--color-error-muted);
  color: var(--color-error);
}

/* Status code cards */
.stats-view__status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-3);
}

.stats-view__status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-surface-2);
  text-align: center;
}

.stats-view__status-card--success {
  border-color: var(--color-success);
  background-color: var(--color-success-muted);
}

.stats-view__status-card--warning {
  border-color: var(--color-warning);
  background-color: var(--color-warning-muted);
}

.stats-view__status-card--error {
  border-color: var(--color-error);
  background-color: var(--color-error-muted);
}

.stats-view__status-code {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
}

.stats-view__status-count {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.stats-view__status-label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
