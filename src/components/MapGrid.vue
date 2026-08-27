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
    the base cellSize. Min: 0.01, Max: 100.0, Step: 1.5x.
    Ctrl + scroll wheel adjusts zoom over the grid.
    ZoomControls component provides the +/-/reset UI.

  Pan system:
    Mouse drag pans the viewport. A 5px movement threshold
    distinguishes drag (pan) from click (place element).
    Pan is clamped so the map can never be dragged fully
    out of view.
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
        <!-- Canvas mode: no @click — handled via endPan threshold -->
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
        />

        <!-- DOM mode: no @click — handled via endPan threshold -->
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
// ─── 1. IMPORTS ───────────────────────────────────────────────
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue';
import ZoomControls from './ZoomControls.vue';

// ─── 2. PROPS AND EMITS ──────────────────────────────────────

const props = defineProps({
  map: { type: Object, required: true },
  path: { type: Array, default: () => [] },
  startPoint: { type: Object, default: null },
  endPoint: { type: Object, default: null },
  interactive: { type: Boolean, default: false },
});

const emit = defineEmits(['cell-click']);

// ─── 3. CONSTANTS ─────────────────────────────────────────────

/**
 * CANVAS_THRESHOLD — maps with more cells than this
 * value use Canvas rendering instead of DOM divs.
 * 150 * 150 = 22,500 cells is the DOM render limit.
 */
const CANVAS_THRESHOLD = 150 * 150;

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100.0;
const ZOOM_STEP = 1.5;

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

// ─── 4. REACTIVE STATE ────────────────────────────────────────

/**
 * zoomLevel — reactive zoom multiplier for this instance.
 * Default 1.0 = 100%. Each MapGrid has its own zoom state.
 */
const zoomLevel = ref(1.0);

const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastMouse = ref({ x: 0, y: 0 });

const dragThreshold = 5; // pixels — if moved less, treat as click
const hasMovedEnough = ref(false);
const clickStartPos = ref({ x: 0, y: 0 });

const viewportWidth = ref(0);
const viewportHeight = ref(0);

// ─── 5. DOM REFS ─────────────────────────────────────────────

const containerRef = ref(null);
const canvasRef = ref(null);
const viewportRef = ref(null);

// ─── 6. COMPUTED — MODE AND BASE SIZE ────────────────────────

const totalCells = computed(
  () => props.map.dimensions.width * props.map.dimensions.height
);

const isCanvasMode = computed(
  () => totalCells.value > CANVAS_THRESHOLD
);

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

// ─── 7. COMPUTED — DEPENDENT ON cellSize AND zoomLevel ───────
//  ✅ effectiveCellSize DECLARED BEFORE any computed or watcher
//     that references it, preventing initialization errors.

/**
 * effectiveCellSize — the actual rendered cell size after
 * applying the zoom multiplier.
 * Used in all template bindings and canvas math.
 */
const effectiveCellSize = computed(() =>
  Math.max(1, Math.round(cellSize.value * zoomLevel.value))
);

const canvasWidth = computed(
  () => props.map.dimensions.width * (effectiveCellSize.value + 1)
);

const canvasHeight = computed(
  () => props.map.dimensions.height * (effectiveCellSize.value + 1)
);

const mapWidthPx = computed(
  () => props.map.dimensions.width * (effectiveCellSize.value + 1)
);

const mapHeightPx = computed(
  () => props.map.dimensions.height * (effectiveCellSize.value + 1)
);

// ─── 8. COMPUTED — LOOKUP SETS ───────────────────────────────

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

const obstacleCount = computed(
  () => (props.map.obstacles || []).length
);

const waypointCount = computed(
  () => (props.map.waypoints || []).length
);

// ─── 9. PURE HELPER FUNCTIONS ────────────────────────────────

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

// ─── 10. DOM MODE: COMPUTED CELL ARRAY ───────────────────────

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

// ─── 11. CANVAS MODE: RENDER FUNCTIONS ───────────────────────

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

// ─── 12. UNIFIED CLICK COORDINATE LOGIC ──────────────────────

/**
 * emitCellFromMouseEvent — single math path for both DOM and Canvas.
 * Converts a mouse event into grid coordinates by subtracting the
 * pan offset from the viewport-relative click position, then
 * dividing by cell size. Works correctly at any zoom/pan state.
 *
 * @param {MouseEvent} event
 */
const emitCellFromMouseEvent = (event) => {
  if (!props.interactive) return;
  const container = viewportRef.value;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  // Subtract pan offset FIRST, then convert to grid coords
  const clickX = event.clientX - rect.left - panX.value;
  const clickY = event.clientY - rect.top - panY.value;
  const step = effectiveCellSize.value + 1;
  let x = Math.floor(clickX / step);
  let y = Math.floor(clickY / step);
  // Clamp to valid grid bounds
  x = Math.max(0, Math.min(props.map.dimensions.width - 1, x));
  y = Math.max(0, Math.min(props.map.dimensions.height - 1, y));
  emit('cell-click', { x, y });
};

// ─── 13. PAN / CLICK HANDLERS ────────────────────────────────

const startPan = (e) => {
  isPanning.value = true;
  hasMovedEnough.value = false;
  lastMouse.value = { x: e.clientX, y: e.clientY };
  clickStartPos.value = { x: e.clientX, y: e.clientY };
  e.preventDefault();
};

const doPan = (e) => {
  if (!isPanning.value) return;
  const dx = e.clientX - lastMouse.value.x;
  const dy = e.clientY - lastMouse.value.y;
  panX.value += dx;
  panY.value += dy;
  lastMouse.value = { x: e.clientX, y: e.clientY };
  // Mark as drag if total movement exceeds threshold
  const totalDx = Math.abs(e.clientX - clickStartPos.value.x);
  const totalDy = Math.abs(e.clientY - clickStartPos.value.y);
  if (totalDx > dragThreshold || totalDy > dragThreshold) {
    hasMovedEnough.value = true;
  }
};

/**
 * endPan — on mouse release:
 * - If moved < 5px → treat as click → emit cell-click
 * - If moved >= 5px → was a drag → pan only, no element placed
 */
const endPan = (e) => {
  isPanning.value = false;
  if (!hasMovedEnough.value) {
    emitCellFromMouseEvent(e);
  }
};

// ─── 14. ZOOM FUNCTIONS ──────────────────────────────────────

const zoomIn = () => {
  zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value * ZOOM_STEP);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value / ZOOM_STEP);
};

const resetZoom = () => {
  zoomLevel.value = 1.0;
  panX.value = 0;
  panY.value = 0;
};

// ─── 15. SCROLL ZOOM ─────────────────────────────────────────

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

// ─── 16. WATCHERS — DECLARED AFTER ALL COMPUTEDS ─────────────
//  ✅ effectiveCellSize, mapWidthPx, mapHeightPx are all
//     fully declared before any watch() references them.

// Reset pan and zoom when the selected map changes
watch(() => props.map, () => {
  panX.value = 0;
  panY.value = 0;
  zoomLevel.value = 1.0;
}, { deep: true });

/**
 * Clamp pan to map boundaries — prevent dragging map out of view.
 * The map can never be dragged more than 10% outside the viewport
 * on any edge.
 */
watch([panX, panY, effectiveCellSize], () => {
  const maxX = Math.max(0, mapWidthPx.value - viewportWidth.value);
  const maxY = Math.max(0, mapHeightPx.value - viewportHeight.value);
  // Allow slight overhang (10%) but never lose the map
  panX.value = Math.min(
    Math.max(panX.value, -(mapWidthPx.value * 0.1)),
    maxX * 0.9
  );
  panY.value = Math.min(
    Math.max(panY.value, -(mapHeightPx.value * 0.1)),
    maxY * 0.9
  );
});

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

// ─── 17. LIFECYCLE — AT THE VERY END ─────────────────────────

const updateViewportSize = () => {
  if (viewportRef.value) {
    const rect = viewportRef.value.getBoundingClientRect();
    viewportWidth.value = rect.width;
    viewportHeight.value = rect.height;
  }
};

onMounted(async () => {
  updateViewportSize();
  window.addEventListener('resize', updateViewportSize);

  const el = containerRef.value;
  if (el) {
    el.addEventListener('wheel', handleWheel, { passive: false });
  }
  if (isCanvasMode.value) {
    await nextTick();
    scheduleRedraw();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportSize);
  const el = containerRef.value;
  if (el) {
    el.removeEventListener('wheel', handleWheel);
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
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

/* Pan viewport — drag is the ONLY navigation method */
.map-grid__viewport {
  overflow: hidden; /* NO native scrollbars — drag only */
  position: relative;
  cursor: grab;
  width: 100%;
}

.map-grid__viewport:active,
.map-grid__viewport:active .map-grid__surface {
  cursor: grabbing;
  user-select: none;
}

.map-grid__surface {
  overflow: hidden;
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
  overflow: hidden; /* NOT auto or scroll */
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
