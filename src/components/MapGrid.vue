<template>
  <div class="map-grid">
    <div class="map-grid__info">
      <span class="map-grid__dimension font-mono">
        {{ map.dimensions.width }} x {{ map.dimensions.height }}
      </span>
      <span class="map-grid__count text-muted">
        {{ obstacleCount }} obstacles,
        {{ waypointCount }} waypoints
      </span>
    </div>

    <div
      class="map-grid__canvas"
      :style="{
        gridTemplateColumns:
          `repeat(${map.dimensions.width}, ${cellSize}px)`,
        gridTemplateRows:
          `repeat(${map.dimensions.height}, ${cellSize}px)`
      }"
    >
      <div
        v-for="cell in cells"
        :key="`${cell.x}-${cell.y}`"
        class="map-grid__cell"
        :class="[
          `map-grid__cell--${cell.type}`,
          { 'map-grid__cell--interactive': interactive }
        ]"
        :style="{
          width: `${cellSize}px`,
          height: `${cellSize}px`
        }"
        :title="interactive
          ? `(${cell.x}, ${cell.y}) - ${cell.type}`
          : undefined"
        :role="interactive ? 'button' : undefined"
        :tabindex="interactive ? 0 : undefined"
        @click="interactive && $emit('cell-click',
          { x: cell.x, y: cell.y })"
        @keydown.enter="interactive && $emit('cell-click',
          { x: cell.x, y: cell.y })"
      />
    </div>

    <div class="map-grid__legend">
      <span class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--obstacle"></span>
        Obstacle
      </span>
      <span class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--waypoint"></span>
        Waypoint
      </span>
      <span v-if="hasPath" class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--path"></span>
        Path
      </span>
      <span v-if="startPoint" class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--start"></span>
        Start
      </span>
      <span v-if="endPoint" class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--end"></span>
        End
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  map: { type: Object, required: true },
  path: { type: Array, default: () => [] },
  startPoint: { type: Object, default: null },
  endPoint: { type: Object, default: null },
  interactive: { type: Boolean, default: false },
});

defineEmits(['cell-click']);

const cellSize = computed(() => {
  const maxDim = Math.max(
    props.map.dimensions.width,
    props.map.dimensions.height
  );
  return Math.max(4, Math.min(40, Math.floor(600 / maxDim)));
});

const obstacleCount = computed(
  () => (props.map.obstacles || []).length
);
const waypointCount = computed(
  () => (props.map.waypoints || []).length
);
const hasPath = computed(() => props.path.length > 0);

/**
 * Build a Set of string keys for O(1) lookup.
 * Key format: "x,y"
 */
const obstacleSet = computed(() =>
  new Set(
    (props.map.obstacles || []).map(
      (o) => `${o.position?.x ?? o.x},${o.position?.y ?? o.y}`
    )
  )
);

const waypointSet = computed(() =>
  new Set(
    (props.map.waypoints || []).map(
      (w) => `${w.position?.x ?? w.x},${w.position?.y ?? w.y}`
    )
  )
);

const pathSet = computed(() =>
  new Set(props.path.map((p) => `${p.x},${p.y}`))
);

/**
 * getCellType — pure function.
 * Returns the display type for a grid cell based on
 * its coordinates and the current map state.
 * Priority: start > end > obstacle > waypoint > path > empty
 */
const getCellType = (x, y) => {
  const key = `${x},${y}`;
  if (props.startPoint &&
      props.startPoint.x === x &&
      props.startPoint.y === y) return 'start';
  if (props.endPoint &&
      props.endPoint.x === x &&
      props.endPoint.y === y) return 'end';
  if (obstacleSet.value.has(key)) return 'obstacle';
  if (waypointSet.value.has(key)) return 'waypoint';
  if (pathSet.value.has(key)) return 'path';
  return 'empty';
};

/**
 * cells — computed array of all grid cells.
 * Iterates y (rows) then x (columns) so the grid
 * renders top-to-bottom, left-to-right.
 */
const cells = computed(() => {
  const result = [];
  for (let y = 0; y < props.map.dimensions.height; y++) {
    for (let x = 0; x < props.map.dimensions.width; x++) {
      result.push({ x, y, type: getCellType(x, y) });
    }
  }
  return result;
});
</script>

<style scoped>
.map-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.map-grid__info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-sm);
}

.map-grid__dimension {
  color: var(--color-accent);
  font-size: var(--text-sm);
}

.map-grid__canvas {
  display: grid;
  gap: 1px;
  background-color: var(--color-border);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: auto;
  max-width: 100%;
}

.map-grid__cell {
  background-color: var(--grid-cell-empty);
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.map-grid__cell--obstacle {
  background-color: var(--grid-cell-obstacle);
}
.map-grid__cell--waypoint {
  background-color: var(--grid-cell-waypoint);
}
.map-grid__cell--path {
  background-color: var(--grid-cell-path);
  opacity: 0.7;
}
.map-grid__cell--start {
  background-color: var(--grid-cell-start);
}
.map-grid__cell--end {
  background-color: var(--grid-cell-end);
}

.map-grid__cell--interactive {
  cursor: pointer;
}
.map-grid__cell--interactive:hover {
  opacity: 0.7;
}

.map-grid__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.map-grid__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.map-grid__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.map-grid__legend-dot--obstacle {
  background-color: var(--grid-cell-obstacle);
}
.map-grid__legend-dot--waypoint {
  background-color: var(--grid-cell-waypoint);
}
.map-grid__legend-dot--path {
  background-color: var(--grid-cell-path);
}
.map-grid__legend-dot--start {
  background-color: var(--grid-cell-start);
}
.map-grid__legend-dot--end {
  background-color: var(--grid-cell-end);
}
</style>
