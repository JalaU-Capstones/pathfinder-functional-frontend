<template>
  <AppLayout>
    <div class="validation-view">
      <div class="validation-view__header">
        <h1 class="validation-view__title">Validation</h1>
        <p class="text-secondary">
          Run backend validation operations against maps,
          routes, and input data. These endpoints
          demonstrate recursive and concurrent validation
          implemented in the backend.
        </p>
      </div>

      <div class="validation-view__grid">
        <!-- UUID Format Validation -->
        <div class="validation-view__card">
          <h2 class="validation-view__card-title">
            UUID Format Validation
          </h2>
          <p class="validation-view__card-desc">
            Validates that a map ID has the correct UUID v4
            format using recursive segment-by-segment
            validation.
          </p>
          <div class="validation-view__input-row">
            <input
              v-model="uuidInput"
              class="validation-view__input font-mono"
              placeholder="3b47e69f-788d-4b19-b81b-0b4a2fd92799"
            />
            <BaseButton
              size="sm"
              :loading="uuidLoading"
              @click="runUuidValidation"
            >
              Validate
            </BaseButton>
          </div>
          <BaseAlert
            v-if="uuidResult"
            :type="uuidResult.type"
            :message="uuidResult.message"
          />
        </div>

        <!-- Map Exists Validation -->
        <div class="validation-view__card">
          <h2 class="validation-view__card-title">
            Map Existence Check
          </h2>
          <p class="validation-view__card-desc">
            Verifies that a map UUID exists in the
            database. Uses async Promise chain.
          </p>
          <div class="validation-view__input-row">
            <select
              v-model="existsMapId"
              class="validation-view__select"
            >
              <option value="" disabled>
                Select a map...
              </option>
              <option
                v-for="map in maps"
                :key="map.id"
                :value="map.id"
              >
                {{ map.name }}
              </option>
            </select>
            <BaseButton
              size="sm"
              :loading="existsLoading"
              @click="runExistsCheck"
            >
              Check
            </BaseButton>
          </div>
          <BaseAlert
            v-if="existsResult"
            :type="existsResult.type"
            :message="existsResult.message"
          />
        </div>

        <!-- Reachability Check -->
        <div class="validation-view__card">
          <h2 class="validation-view__card-title">
            Waypoint Reachability
          </h2>
          <p class="validation-view__card-desc">
            Checks that all waypoints on a selected map
            are reachable from the starting point using
            an accumulator pattern.
          </p>
          <div class="validation-view__input-col">
            <select
              v-model="reachabilityMapId"
              class="validation-view__select"
            >
              <option value="" disabled>
                Select a map...
              </option>
              <option
                v-for="map in maps"
                :key="map.id"
                :value="map.id"
              >
                {{ map.name }}
              </option>
            </select>
            <BaseButton
              size="sm"
              :loading="reachabilityLoading"
              :disabled="!reachabilityMapId"
              @click="runReachabilityCheck"
            >
              Check Reachability
            </BaseButton>
          </div>
          <BaseAlert
            v-if="reachabilityResult"
            :type="reachabilityResult.type"
            :message="reachabilityResult.message"
          />
        </div>

        <!-- Same Point Check -->
        <div class="validation-view__card">
          <h2 class="validation-view__card-title">
            Same Point Detection
          </h2>
          <p class="validation-view__card-desc">
            Detects if start and end points are identical.
            Returns a special message instead of running A*.
          </p>
          <div class="validation-view__coord-row">
            <div class="validation-view__coord-group">
              <span class="validation-view__coord-label
                text-success">
                Start
              </span>
              <input
                v-model.number="samePointStart.x"
                type="number"
                class="validation-view__coord-input"
                placeholder="X"
              />
              <input
                v-model.number="samePointStart.y"
                type="number"
                class="validation-view__coord-input"
                placeholder="Y"
              />
            </div>
            <div class="validation-view__coord-group">
              <span class="validation-view__coord-label
                text-error">
                End
              </span>
              <input
                v-model.number="samePointEnd.x"
                type="number"
                class="validation-view__coord-input"
                placeholder="X"
              />
              <input
                v-model.number="samePointEnd.y"
                type="number"
                class="validation-view__coord-input"
                placeholder="Y"
              />
            </div>
            <BaseButton
              size="sm"
              :loading="samePointLoading"
              @click="runSamePointCheck"
            >
              Check
            </BaseButton>
          </div>
          <BaseAlert
            v-if="samePointResult"
            :type="samePointResult.type"
            :message="samePointResult.message"
          />
        </div>

        <!-- Cyclic Dependencies -->
        <div class="validation-view__card
          validation-view__card--wide">
          <h2 class="validation-view__card-title">
            Cyclic Dependency Detection
          </h2>
          <p class="validation-view__card-desc">
            Detects cyclic dependencies in a map connection
            graph using recursive DFS traversal.
          </p>
          <div class="validation-view__textarea-row">
            <textarea
              v-model="cyclicJson"
              class="validation-view__textarea font-mono"
              rows="5"
              placeholder='[{"source":"A","target":"B"},
{"source":"B","target":"C"},
{"source":"C","target":"A"}]'
            ></textarea>
            <BaseButton
              size="sm"
              :loading="cyclicLoading"
              @click="runCyclicCheck"
            >
              Detect Cycles
            </BaseButton>
          </div>
          <BaseAlert
            v-if="cyclicResult"
            :type="cyclicResult.type"
            :message="cyclicResult.message"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import {
  validateMapIdFormat,
  checkMapExists,
  checkReachability,
  checkSamePoint,
  detectCyclicDependencies,
  getAllMaps,
} from '@/api';

const maps = ref([]);

// UUID validation
const uuidInput = ref('');
const uuidLoading = ref(false);
const uuidResult = ref(null);

// Map exists
const existsMapId = ref('');
const existsLoading = ref(false);
const existsResult = ref(null);

// Reachability
const reachabilityMapId = ref('');
const reachabilityLoading = ref(false);
const reachabilityResult = ref(null);

// Same point
const samePointStart = ref({ x: 0, y: 0 });
const samePointEnd = ref({ x: 0, y: 0 });
const samePointLoading = ref(false);
const samePointResult = ref(null);

// Cyclic
const cyclicJson = ref('');
const cyclicLoading = ref(false);
const cyclicResult = ref(null);

/**
 * toResult — converts an API response or error into
 * a { type, message } object for BaseAlert.
 */
const toResult = (data, successType = 'success') => ({
  type: successType,
  message: data.message || JSON.stringify(data),
});

const toError = (err) => ({
  type: 'error',
  message: err.message || 'Validation failed.',
});

const runUuidValidation = async () => {
  if (!uuidInput.value.trim()) return;
  uuidLoading.value = true;
  uuidResult.value = null;
  try {
    const data = await validateMapIdFormat(
      uuidInput.value.trim()
    );
    uuidResult.value = toResult(data);
  } catch (err) {
    uuidResult.value = toError(err);
  } finally {
    uuidLoading.value = false;
  }
};

const runExistsCheck = async () => {
  if (!existsMapId.value) return;
  existsLoading.value = true;
  existsResult.value = null;
  try {
    const data = await checkMapExists(existsMapId.value);
    existsResult.value = toResult(data);
  } catch (err) {
    existsResult.value = toError(err);
  } finally {
    existsLoading.value = false;
  }
};

const runReachabilityCheck = async () => {
  if (!reachabilityMapId.value) return;
  reachabilityLoading.value = true;
  reachabilityResult.value = null;
  try {
    const selectedMap = maps.value.find(
      (m) => m.id === reachabilityMapId.value
    );
    if (!selectedMap) throw new Error('Map not found.');

    const mapPayload = {
      startingPoint: [0, 0],
      stoppingPoints: (selectedMap.waypoints || []).map(
        (w) => [w.position.x, w.position.y]
      ),
      obstacles: (selectedMap.obstacles || []).map(
        (o) => [o.position.x, o.position.y]
      ),
    };

    const data = await checkReachability(mapPayload);

    const unreachable = data.unreachablePoints || [];
    reachabilityResult.value = {
      type: unreachable.length === 0 ? 'success' : 'warning',
      message: unreachable.length === 0
        ? 'All waypoints are reachable from the origin.'
        : `${unreachable.length} unreachable waypoint(s): ` +
          unreachable.map(
            (p) => `(${p[0]},${p[1]})`
          ).join(', '),
    };
  } catch (err) {
    reachabilityResult.value = toError(err);
  } finally {
    reachabilityLoading.value = false;
  }
};

const runSamePointCheck = async () => {
  samePointLoading.value = true;
  samePointResult.value = null;
  try {
    const data = await checkSamePoint(
      samePointStart.value,
      samePointEnd.value
    );
    samePointResult.value = {
      type: data.samePoint ? 'warning' : 'success',
      message: data.message,
    };
  } catch (err) {
    samePointResult.value = toError(err);
  } finally {
    samePointLoading.value = false;
  }
};

const runCyclicCheck = async () => {
  cyclicLoading.value = true;
  cyclicResult.value = null;
  try {
    let connections;
    try {
      connections = JSON.parse(cyclicJson.value);
    } catch {
      throw new Error(
        'Invalid JSON. Enter an array of ' +
        '{"source","target"} objects.'
      );
    }
    const data = await detectCyclicDependencies(
      { connections }
    );
    cyclicResult.value = toResult(data);
  } catch (err) {
    cyclicResult.value = toError(err);
  } finally {
    cyclicLoading.value = false;
  }
};

onMounted(async () => {
  try {
    maps.value = await getAllMaps();
  } catch {
    // Maps load silently — not critical for this view
  }
});
</script>

<style scoped>
.validation-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.validation-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.validation-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.validation-view__grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(min(360px, 100%), 1fr));
  gap: var(--space-4);
}

.validation-view__card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.validation-view__card--wide {
  grid-column: 1 / -1;
  max-width: 100%;
}

.validation-view__card-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.validation-view__card-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.validation-view__input-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.validation-view__input-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.validation-view__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  outline: none;
  min-width: 0;
  transition: border-color var(--transition-fast);
}

.validation-view__input:focus {
  border-color: var(--color-accent);
}

.validation-view__select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
  transition: border-color var(--transition-fast);
}

.validation-view__select:focus {
  border-color: var(--color-accent);
}

.validation-view__coord-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}

.validation-view__coord-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.validation-view__coord-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  min-width: 36px;
}

.validation-view__coord-input {
  width: 60px;
  padding: var(--space-2) var(--space-2);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-align: center;
  outline: none;
}

.validation-view__coord-input:focus {
  border-color: var(--color-accent);
}

.validation-view__textarea-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.validation-view__textarea {
  width: 100%;
  padding: var(--space-3);
  background-color: var(--color-bg-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--text-xs);
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast);
  line-height: 1.5;
}

.validation-view__textarea:focus {
  border-color: var(--color-accent);
}
</style>
