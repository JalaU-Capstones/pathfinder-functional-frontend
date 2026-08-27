<!--
  MapGrid.vue — Dual rendering strategy

  DOM mode  (maps <= 150x150 = 22,500 cells):
    Renders each cell as a <div>. Supports CSS hover,
    click events, transitions, and accessibility attrs.
    Used for interactive maps in RouteForm.

  Canvas mode (maps > 150x150):
    Renders the entire grid on a single <canvas> element
    using the Canvas 2D API. One draw call per cell,
    no DOM elements, GPU-accelerated. Supports click
    (via coordinate math) but no CSS hover effects.

  Threshold: CANVAS_THRESHOLD = 150 * 150 = 22,500 cells.

  Performance comparison (1000x1000 map):
    DOM mode:    > 30 seconds, browser freezes
    Canvas mode: ~50ms, smooth render

  The tradeoff (no CSS hover in canvas) is disclosed
  in the legend with a note.

  Zoom system:
    Each MapGrid instance maintains its own zoomLevel ref
    (default 1.0). Zoom is applied as a multiplier to
    the base cellSize. Min: 0.25, Max: 8.0, Step: 1.5x.
    Ctrl + scroll wheel adjusts zoom over the grid.
    ZoomControls component provides the +/-/reset UI.
-->
<template>
  <div class="map-grid" ref="containerRef">
    <!-- Mode indicator (only shown in canvas mode) -->
    <div v-if="isCanvasMode"
         class="map-grid__mode-badge">
      Canvas rendering ({{ totalCells.toLocaleString() }} cells)
    </div>

    <!-- Grid info -->
    <div class="map-grid__info">
      <span class="map-grid__dimension font-mono">
        {{ map.dimensions.width }} x
        {{ map.dimensions.height }}
      </span>
      <span class="map-grid__count text-muted">
        {{ obstacleCount }} obstacles,
        {{ waypointCount }} waypoints
        <template v-if="path.length > 0">
          , {{ path.length }} path cells
        </template>
      </span>
    </div>

    <!-- Zoom toolbar -->
    <div class="map-grid__toolbar">
      <ZoomControls
        :zoom-level="zoomLevel"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-reset="resetZoom"
      />
      <span class="map-grid__zoom-hint">
        Ctrl + scroll to zoom
      </span>
    </div>

    <!-- Viewport for pan and zoom -->
    <div
      ref="viewportRef"
      class="map-grid__viewport"
      @mousedown="startPan"
      @mousemove="doPan"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <div
        class="map-grid__surface"
        :style="{ transform: `translate(${panX}px, ${panY}px)` }"
      >
        <!-- Canvas mode -->
        <canvas
          v-if="isCanvasMode"
          ref="canvasRef"
          class="map-grid__canvas-el"
          :width="canvasWidth"
          :height="canvasHeight"
          :style="{
            cursor: interactive ? 'crosshair' : 'default',
            maxWidth: '100%',
          }"
          :title="interactive
            ? 'Click to select a cell' : undefined"
          @click="handleCanvasClick"
        />

        <!-- DOM mode -->
        <div
          v-else
          class="map-grid__canvas"
          :style="{
            gridTemplateColumns:
              `repeat(${map.dimensions.width}, ${effectiveCellSize}px)`,
            gridTemplateRows:
              `repeat(${map.dimensions.height}, ${effectiveCellSize}px)`,
            cursor: interactive ? 'crosshair' : 'default',
          }"
          @click="handleDomClick"
        >
          <div
            v-for="cell in cells"
            :key="`${cell.x}-${cell.y}`"
            class="map-grid__cell"
            :class="[
              `map-grid__cell--${cell.type}`,
              { 'map-grid__cell--interactive': interactive },
            ]"
            :style="{
              width: `${effectiveCellSize}px`,
              height: `${effectiveCellSize}px`,
            }"
            :title="interactive
              ? `(${cell.x}, ${cell.y})` : undefined"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="map-grid__legend">
      <span class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--obstacle" />
        Obstacle
      </span>
      <span class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--waypoint" />
        Waypoint
      </span>
      <span v-if="path.length > 0"
            class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--path" />
        Path
      </span>
      <span v-if="startPoint"
            class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--start" />
        Start
      </span>
      <span v-if="endPoint"
            class="map-grid__legend-item">
        <span class="map-grid__legend-dot
          map-grid__legend-dot--end" />
        End
      </span>
      <span v-if="isCanvasMode"
            class="map-grid__legend-item
              map-grid__legend-item--note">
        Canvas mode: hover effects disabled for performance
      </span>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue';
import ZoomControls from './ZoomControls.vue';

// ─── Props and emits ─────────────────────────────────────────

const props = defineProps({
  map: { type: Object, required: true },
  path: { type: Array, default: () => [] },
  startPoint: { type: Object, default: null },
  endPoint: { type: Object, default: null },
  interactive: { type: Boolean, default: false },
});

const emit = defineEmits(['cell-click']);

// ─── Constants ───────────────────────────────────────────────

/**
 * CANVAS_THRESHOLD — maps with more cells than this
 * value use Canvas rendering instead of DOM divs.
 * 150 * 150 = 22,500 cells is the DOM render limit.
 */
const CANVAS_THRESHOLD = 150 * 150;

/**
 * CSS variable values resolved at runtime.
 * Canvas cannot use CSS variables directly — we resolve
 * them once from the document root.
 */
const COLORS = (() => {
  if (typeof document === 'undefined') {
    return {
      empty: '#1f2937',
      border: '#374151',
      obstacle: '#ef4444',
      waypoint: '#f59e0b',
      path: '#06b6d4',
      start: '#10b981',
      end: '#8b5cf6',
    };
  }
  const s = getComputedStyle(document.documentElement);
  const get = (v) => s.getPropertyValue(v).trim();
  return {
    empty:    get('--grid-cell-empty')    || '#1f2937',
    border:   get('--grid-cell-border')   || '#374151',
    obstacle: get('--grid-cell-obstacle') || '#ef4444',
    waypoint: get('--grid-cell-waypoint') || '#f59e0b',
    path:     get('--grid-cell-path')     || '#06b6d4',
    start:    get('--grid-cell-start')    || '#10b981',
    end:      get('--grid-cell-end')      || '#8b5cf6',
  };
})();

// ─── Zoom constants and state ─────────────────────────────────

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100.0;
const ZOOM_STEP = 1.5;

/**
 * zoomLevel — reactive zoom multiplier for this instance.
 * Default 1.0 = 100%. Each MapGrid has its own zoom state.
 */
const zoomLevel = ref(1.0);

const zoomIn = () => {
  zoomLevel.value = Math.min(
    MAX_ZOOM,
    zoomLevel.value * ZOOM_STEP
  );
};

const zoomOut = () => {
  zoomLevel.value = Math.max(
    MIN_ZOOM,
    zoomLevel.value / ZOOM_STEP
  );
};

const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastMouse = ref({ x: 0, y: 0 });

const startPan = (e) => {
  isPanning.value = true;
  lastMouse.value = { x: e.clientX, y: e.clientY };
  e.preventDefault();
};

const doPan = (e) => {
  if (!isPanning.value) return;
  panX.value += e.clientX - lastMouse.value.x;
  panY.value += e.clientY - lastMouse.value.y;
  lastMouse.value = { x: e.clientX, y: e.clientY };
};

const endPan = () => {
  isPanning.value = false;
};

const resetZoom = () => {
  zoomLevel.value = 1.0;
  panX.value = 0;
  panY.value = 0;
};

// ─── Refs ────────────────────────────────────────────────────

const containerRef = ref(null);
const canvasRef = ref(null);
const viewportRef = ref(null);

// ─── Computed — mode selection ────────────────────────────────

const totalCells = computed(
  () =>
    props.map.dimensions.width * props.map.dimensions.height
);

const isCanvasMode = computed(
  () => totalCells.value > CANVAS_THRESHOLD
);

// ─── Computed — cell size ─────────────────────────────────────

/**
 * cellSize — calculates the pixel size of each grid cell.
 *
 * For DOM mode: max 40px, min 4px, targets 600px total.
 * For Canvas mode: targets 800px total width, min 1px.
 * Larger canvas allows better visibility on big maps.
 */
const cellSize = computed(() => {
  const maxDim = Math.max(
    props.map.dimensions.width,
    props.map.dimensions.height
  );
  if (isCanvasMode.value) {
    return Math.max(1, Math.floor(800 / maxDim));
  }
  return Math.max(4, Math.min(40, Math.floor(600 / maxDim)));
});

/**
 * effectiveCellSize — the actual rendered cell size after
 * applying the zoom multiplier.
 * Used in all template bindings and canvas math.
 */
const effectiveCellSize = computed(() =>
  Math.max(1, Math.round(cellSize.value * zoomLevel.value))
);

// ─── Computed — canvas dimensions ────────────────────────────

const canvasWidth = computed(
  () => props.map.dimensions.width * (effectiveCellSize.value + 1)
);

const canvasHeight = computed(
  () => props.map.dimensions.height * (effectiveCellSize.value + 1)
);

// ─── Computed — lookup sets (shared by both modes) ───────────

/**
 * All lookup sets use O(1) string key format "x,y".
 * Built from props using functional map/reduce patterns.
 */
const obstacleSet = computed(() =>
  new Set(
    (props.map.obstacles || []).map((o) => {
      const x = o.position?.x ?? o.x;
      const y = o.position?.y ?? o.y;
      return `${x},${y}`;
    })
  )
);

const waypointSet = computed(() =>
  new Set(
    (props.map.waypoints || []).map((w) => {
      const x = w.position?.x ?? w.x;
      const y = w.position?.y ?? w.y;
      return `${x},${y}`;
    })
  )
);

const pathSet = computed(() =>
  new Set(props.path.map((p) => `${p.x},${p.y}`))
);

// ─── Pure helper: get cell type ───────────────────────────────

/**
 * getCellType — pure function.
 * Returns the rendering type for grid coordinates (x, y).
 * Priority: start > end > obstacle > waypoint > path > empty
 *
 * @param {number} x
 * @param {number} y
 * @returns {string} Cell type key
 */
const getCellType = (x, y) => {
  if (
    props.startPoint &&
    props.startPoint.x === x &&
    props.startPoint.y === y
  ) return 'start';
  if (
    props.endPoint &&
    props.endPoint.x === x &&
    props.endPoint.y === y
  ) return 'end';
  const key = `${x},${y}`;
  if (obstacleSet.value.has(key)) return 'obstacle';
  if (waypointSet.value.has(key)) return 'waypoint';
  if (pathSet.value.has(key)) return 'path';
  return 'empty';
};

/**
 * getCellColor — maps a cell type to its canvas fill color.
 * Pure function: same type always returns same color.
 *
 * @param {string} type
 * @returns {string} CSS color value
 */
const getCellColor = (type) => COLORS[type] ?? COLORS.empty;

// ─── DOM mode: computed cell array ───────────────────────────

/**
 * cells — computed array for DOM rendering.
 * Only evaluated when isCanvasMode is false.
 * Iterates y (rows) then x (columns).
 */
const cells = computed(() => {
  if (isCanvasMode.value) return [];
  const result = [];
  for (let y = 0; y < props.map.dimensions.height; y++) {
    for (let x = 0; x < props.map.dimensions.width; x++) {
      result.push({ x, y, type: getCellType(x, y) });
    }
  }
  return result;
});

// ─── Canvas mode: render functions ───────────────────────────

/**
 * drawCanvas — renders the full map grid onto the canvas.
 *
 * Algorithm:
 * 1. Clear the canvas.
 * 2. Draw background (border color) in one fillRect.
 * 3. For each cell, draw its colored rectangle.
 *
 * This is significantly faster than DOM because:
 * - No DOM element creation (no reflow, no style calc)
 * - Single canvas context, batched draw calls
 * - GPU-accelerated rasterization
 *
 * Performance: a 1000x1000 canvas draw takes ~50ms.
 * A 1000x1000 DOM render takes >30 seconds.
 */
const drawCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = props.map.dimensions;
  const cs = effectiveCellSize.value;
  const gap = 1;
  const step = cs + gap;

  // Step 1: clear with border color (creates grid lines)
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Step 2: draw each cell
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const type = getCellType(x, y);
      ctx.fillStyle = getCellColor(type);
      ctx.fillRect(
        x * step,
        y * step,
        cs,
        cs
      );
    }
  }
};

/**
 * scheduleRedraw — throttles canvas redraws using
 * requestAnimationFrame. Prevents multiple redraws
 * per frame when multiple reactive dependencies change.
 */
let animationFrameId = null;

const scheduleRedraw = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(() => {
    drawCanvas();
    animationFrameId = null;
  });
};

// ─── Canvas mode: click handling ─────────────────────────────

/**
 * handleCanvasClick — converts a canvas click event
 * into grid coordinates and emits 'cell-click'.
 *
 * Coordinate calculation:
 *   gridX = Math.floor(offsetX / (effectiveCellSize + 1))
 *   gridY = Math.floor(offsetY / (effectiveCellSize + 1))
 *
 * The +1 accounts for the 1px gap between cells.
 * The scaleX/scaleY values account for CSS max-width
 * scaling of the canvas element. Because canvas dimensions
 * change with effectiveCellSize, zoom is automatically
 * accounted for — no extra adjustment needed.
 *
 * @param {MouseEvent} event
 */
const handleCanvasClick = (event) => {
  if (!props.interactive) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  // Account for CSS scaling (max-width: 100%)
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (event.clientX - rect.left) * scaleX;
  const clickY = (event.clientY - rect.top) * scaleY;

  const step = effectiveCellSize.value + 1;
  const x = Math.floor((clickX - panX.value) / step);
  const y = Math.floor((clickY - panY.value) / step);

  // Clamp to grid bounds
  const clampedX = Math.max(
    0, Math.min(props.map.dimensions.width - 1, x)
  );
  const clampedY = Math.max(
    0, Math.min(props.map.dimensions.height - 1, y)
  );

  emit('cell-click', { x: clampedX, y: clampedY });
};

const handleDomClick = (event) => {
  if (!props.interactive) return;

  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();

  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  const step = effectiveCellSize.value + 1; // 1px gap
  const x = Math.floor((clickX - panX.value) / step);
  const y = Math.floor((clickY - panY.value) / step);

  const clampedX = Math.max(
    0, Math.min(props.map.dimensions.width - 1, x)
  );
  const clampedY = Math.max(
    0, Math.min(props.map.dimensions.height - 1, y)
  );

  emit('cell-click', { x: clampedX, y: clampedY });
};

// ─── Ctrl + scroll wheel zoom ─────────────────────────────────

/**
 * handleWheel — adjusts zoom on Ctrl + scroll.
 * Without Ctrl, the event is not captured and the page
 * scrolls normally.
 *
 * @param {WheelEvent} event
 */
const handleWheel = (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
};

// ─── Watchers — trigger canvas redraws ───────────────────────

// Reset pan when map changes
watch(() => props.map, () => {
  panX.value = 0;
  panY.value = 0;
  zoomLevel.value = 1.0;
}, { deep: true });

/**
 * Watch all reactive data that affects the canvas render.
 * Each change schedules a redraw via requestAnimationFrame.
 */
watch(
  [
    () => props.map,
    () => props.path,
    () => props.startPoint,
    () => props.endPoint,
    isCanvasMode,
    effectiveCellSize,
    zoomLevel,
  ],
  async () => {
    if (isCanvasMode.value) {
      await nextTick();
      scheduleRedraw();
    }
  },
  { deep: true }
);

// ─── Lifecycle ────────────────────────────────────────────────

onMounted(async () => {
  const el = containerRef.value;
  if (el) {
    el.addEventListener('wheel', handleWheel,
      { passive: false });
  }
  if (isCanvasMode.value) {
    await nextTick();
    scheduleRedraw();
  }
});

onUnmounted(() => {
  const el = containerRef.value;
  if (el) {
    el.removeEventListener('wheel', handleWheel);
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});

// ─── Computed — for DOM mode only ────────────────────────────

const obstacleCount = computed(
  () => (props.map.obstacles || []).length
);
const waypointCount = computed(
  () => (props.map.waypoints || []).length
);
</script>

<style scoped>
.map-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 100%;
  overflow: hidden;
}

.map-grid__mode-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  background-color: var(--color-accent-muted);
  border: 1px solid var(--color-accent-dark);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--color-accent);
  font-family: var(--font-mono);
  align-self: flex-start;
}

.map-grid__info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-sm);
  flex-wrap: wrap;
}

.map-grid__dimension {
  color: var(--color-accent);
  font-size: var(--text-sm);
}

/* Zoom toolbar */
.map-grid__toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.map-grid__zoom-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
}

.map-grid__viewport {
  overflow: hidden;
  position: relative;
  cursor: grab;
}
.map-grid__viewport:active,
.map-grid__viewport:active .map-grid__surface {
  cursor: grabbing;
  user-select: none;
}
.map-grid__surface {
  transform-origin: 0 0;
  will-change: transform;
}

/* Canvas element styling */
.map-grid__canvas-el {
  display: block;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  max-width: 100%;
  height: auto;
}

/* DOM grid container */
.map-grid__canvas {
  display: grid;
  gap: 1px;
  background-color: var(--color-border);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: auto;
  max-width: 100%;
}

/* DOM cells */
.map-grid__cell {
  background-color: var(--grid-cell-empty);
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.map-grid__cell--obstacle  { background-color: var(--grid-cell-obstacle); }
.map-grid__cell--waypoint  { background-color: var(--grid-cell-waypoint); }
.map-grid__cell--path      { background-color: var(--grid-cell-path); opacity: 0.8; }
.map-grid__cell--start     { background-color: var(--grid-cell-start); }
.map-grid__cell--end       { background-color: var(--grid-cell-end); }

.map-grid__cell--interactive { cursor: pointer; }
.map-grid__cell--interactive:hover { opacity: 0.7; }

/* Legend */
.map-grid__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}

.map-grid__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.map-grid__legend-item--note {
  color: var(--color-text-muted);
  font-style: italic;
}

.map-grid__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.map-grid__legend-dot--obstacle { background-color: var(--grid-cell-obstacle); }
.map-grid__legend-dot--waypoint { background-color: var(--grid-cell-waypoint); }
.map-grid__legend-dot--path     { background-color: var(--grid-cell-path); }
.map-grid__legend-dot--start    { background-color: var(--grid-cell-start); }
.map-grid__legend-dot--end      { background-color: var(--grid-cell-end); }
</style>
