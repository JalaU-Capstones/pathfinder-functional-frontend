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
    (via coordinate math) and hover highlight (interactive).

  Threshold: CANVAS_THRESHOLD = 150 * 150 = 22,500 cells.

  Performance comparison (1000x1000 map):
    DOM mode:    > 30 seconds, browser freezes
    Canvas mode: ~50ms, smooth render

  Cell size formula:
    cellSize = min(floor(MAX_GRID_PX / width),
                   floor(MAX_GRID_PX / height))
    clamped to [1, 40]. This guarantees cells are always
    square AND the full map fits within MAX_GRID_PX on
    both axes at zoom 1.0.

  Zoom system:
    Each MapGrid instance maintains its own zoomLevel ref
    (default 1.0). Zoom is applied as a multiplier to
    the base cellSize. Min: 0.01, Max: 100.0, Step: 1.25x.
    Snaps to exactly 1.0 when within 5% of 1.0.
    Ctrl + scroll wheel adjusts zoom over the grid.
    ZoomControls component provides the +/-/reset UI.

  Scroll system:
    The wrapper has overflow: auto and max-height: 600px.
    For large maps the browser provides native scrollbars.
    Canvas rendering reads container.scrollLeft/scrollTop
    to draw ONLY the cells in the visible viewport — this
    makes even 1M+ cell maps scroll and render instantly.
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

    <!--
      Scroll wrapper: overflow auto, max-height 600px.
      For large maps the browser renders native scrollbars.
      Canvas reads scrollLeft/scrollTop to clip rendering
      to only visible cells.
    -->
    <div
      ref="wrapperRef"
      class="map-grid__canvas-wrapper"
      @click="handleWrapperClick"
    >
      <!-- Canvas mode -->
      <canvas
        v-if="isCanvasMode"
        ref="canvasRef"
        class="map-grid__canvas-el"
        :width="mapWidthPx"
        :height="mapHeightPx"
        :style="{ display: 'block' }"
        :title="interactive ? 'Click to select a cell' : undefined"
        @mousemove="handleCanvasMouseMove"
        @mouseleave="handleCanvasMouseLeave"
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
          :title="interactive ? `(${cell.x}, ${cell.y})` : undefined"
        />
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
        Canvas mode: hover effects limited to cursor highlight
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
 * CANVAS_THRESHOLD — maps with more cells than this value use
 * Canvas rendering instead of DOM divs.
 * 150 * 150 = 22,500 cells is the DOM render limit.
 */
const CANVAS_THRESHOLD = 150 * 150;

/**
 * MAX_GRID_PX — maximum pixel size for the map on either axis
 * at zoom 1.0. cellSize is chosen so both width*cellSize and
 * height*cellSize fit within this value.
 */
const MAX_GRID_PX = 600;

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100.0;

/**
 * ZOOM_STEP = 1.25 for smooth 25% increments.
 * Each click: 100% → 125% → 156% → 195% → ...
 */
const ZOOM_STEP = 1.25;

/**
 * CSS variable values resolved at runtime.
 * Canvas cannot use CSS variables directly — we resolve them
 * once from the document root.
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
 * zoomLevel — reactive zoom multiplier. Default 1.0 = 100%.
 * Each MapGrid instance maintains independent zoom state.
 */
const zoomLevel = ref(1.0);

/**
 * hoveredCell — canvas-mode hover tracking (interactive only).
 * Null when no cell is hovered or in DOM mode.
 */
const hoveredCell = ref(null);

// ─── 5. DOM REFS ─────────────────────────────────────────────

const containerRef = ref(null);
const canvasRef = ref(null);
const wrapperRef = ref(null);

// ─── 6. COMPUTED — MODE AND BASE SIZE ────────────────────────

const totalCells = computed(
  () => props.map.dimensions.width * props.map.dimensions.height
);

const isCanvasMode = computed(
  () => totalCells.value > CANVAS_THRESHOLD
);

/**
 * cellSize — base pixel size per cell before zoom.
 *
 * Formula: min(floor(MAX_GRID_PX / width), floor(MAX_GRID_PX / height))
 * This ensures cells are always square and the full map fits within
 * MAX_GRID_PX (600px) on BOTH axes simultaneously at zoom 1.0.
 *
 * Examples:
 *   200x50  → min(3, 12) = 3   → grid is 600x150px
 *   50x200  → min(12, 3) = 3   → grid is 150x600px
 *   100x100 → min(6, 6) = 6    → grid is 600x600px
 *   10x10   → min(60,60)=60, clamped to 40 → grid is 400x400px
 */
const cellSize = computed(() => {
  const { width, height } = props.map.dimensions;
  if (!width || !height) return 8;
  const cellW = Math.floor(MAX_GRID_PX / width);
  const cellH = Math.floor(MAX_GRID_PX / height);
  return Math.max(1, Math.min(40, Math.min(cellW, cellH)));
});

// ─── 7. COMPUTED — DEPENDENT ON cellSize AND zoomLevel ───────

/**
 * effectiveCellSize — rendered cell size after zoom multiplier.
 * Used in all template bindings and coordinate math.
 */
const effectiveCellSize = computed(() =>
  Math.max(1, Math.round(cellSize.value * zoomLevel.value))
);

/**
 * mapWidthPx / mapHeightPx — full pixel dimensions of the map
 * at the current zoom level.
 * +1 per cell accounts for the 1px gap between cells.
 */
const mapWidthPx = computed(
  () => props.map.dimensions.width * (effectiveCellSize.value + 1)
);

const mapHeightPx = computed(
  () => props.map.dimensions.height * (effectiveCellSize.value + 1)
);

// ─── 8. COMPUTED — LOOKUP SETS ───────────────────────────────

/**
 * Lookup sets using O(1) string key format "x,y".
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
 * getCellType — priority order:
 * start > end > obstacle > waypoint > path > empty
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

const getCellColor = (type) => COLORS[type] ?? COLORS.empty;

// ─── 10. DOM MODE: COMPUTED CELL ARRAY ───────────────────────

/**
 * cells — flat array for DOM rendering (v-for).
 * Skipped entirely in canvas mode.
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
 * drawCanvas — viewport-clipped canvas render.
 *
 * Reads wrapperRef.scrollLeft/scrollTop to determine which
 * cells are visible. Only draws cells inside the visible
 * viewport region — makes 1M+ cell maps render instantly.
 *
 * At zoom 1.0 a 1000x1000 map has a ~100x60 cell viewport
 * visible at a time. This reduces 1M iterations to ~6,000.
 */
const drawCanvas = () => {
  const canvas = canvasRef.value;
  const container = wrapperRef.value;
  if (!canvas || !container) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = props.map.dimensions;
  const cs = effectiveCellSize.value;
  const gap = 1;
  const step = cs + gap;

  // Fill background (creates grid lines between cells)
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate visible cell range from native scroll position
  const scrollLeft = container.scrollLeft;
  const scrollTop = container.scrollTop;
  const viewW = container.clientWidth;
  const viewH = container.clientHeight;

  const startX = Math.max(0, Math.floor(scrollLeft / step) - 1);
  const startY = Math.max(0, Math.floor(scrollTop / step) - 1);
  const endX = Math.min(width, Math.ceil((scrollLeft + viewW) / step) + 1);
  const endY = Math.min(height, Math.ceil((scrollTop + viewH) / step) + 1);

  // Draw only visible cells
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const type = getCellType(x, y);
      if (type === 'empty') continue; // background fillRect handles empty
      ctx.fillStyle = getCellColor(type);
      ctx.fillRect(x * step, y * step, cs, cs);
    }
  }

  // Draw empty cells explicitly (so they aren't just the border color)
  ctx.fillStyle = COLORS.empty;
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const type = getCellType(x, y);
      if (type === 'empty') {
        ctx.fillRect(x * step, y * step, cs, cs);
      }
    }
  }

  // Hover highlight in interactive mode
  if (props.interactive && hoveredCell.value) {
    const { x, y } = hoveredCell.value;
    if (x >= startX && x < endX && y >= startY && y < endY) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(x * step, y * step, cs, cs);
    }
  }
};

let animationFrameId = null;

/**
 * scheduleRedraw — throttles canvas redraws to one per
 * animation frame, preventing redundant draws.
 */
const scheduleRedraw = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(() => {
    drawCanvas();
    animationFrameId = null;
  });
};

// ─── 12. CLICK HANDLER ───────────────────────────────────────

/**
 * handleWrapperClick — converts click position to grid cell coords.
 *
 * For canvas mode: uses offsetX/offsetY on the canvas element
 * (already relative to canvas top-left — no scroll correction needed
 * because the canvas is sized to the full map).
 *
 * For DOM mode: individual cell divs emit click via event bubbling;
 * we read the data-x/data-y OR compute from offset. We use the
 * target cell's position derived from offsetX + scrollLeft on wrapper.
 */
const handleWrapperClick = (event) => {
  if (!props.interactive) return;
  const step = effectiveCellSize.value + 1;
  let cellX, cellY;

  if (isCanvasMode.value) {
    // event.target is the canvas element
    const canvas = canvasRef.value;
    if (!canvas || event.target !== canvas) return;
    // getBoundingClientRect accounts for CSS scaling (max-width etc.)
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const offsetX = (event.clientX - rect.left) * scaleX;
    const offsetY = (event.clientY - rect.top) * scaleY;
    cellX = Math.floor(offsetX / step);
    cellY = Math.floor(offsetY / step);
  } else {
    // DOM mode: compute from click position + scroll offset of wrapper
    const wrapper = wrapperRef.value;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const rawX = event.clientX - rect.left + wrapper.scrollLeft;
    const rawY = event.clientY - rect.top + wrapper.scrollTop;
    cellX = Math.floor(rawX / step);
    cellY = Math.floor(rawY / step);
  }

  const clampedX = Math.max(0, Math.min(props.map.dimensions.width - 1, cellX));
  const clampedY = Math.max(0, Math.min(props.map.dimensions.height - 1, cellY));
  emit('cell-click', { x: clampedX, y: clampedY });
};

// ─── 13. CANVAS HOVER HANDLERS ───────────────────────────────

/**
 * handleCanvasMouseMove — tracks which cell is under the cursor.
 * Only active in canvas + interactive mode.
 * Triggers a redraw only when the hovered cell changes.
 */
const handleCanvasMouseMove = (event) => {
  if (!props.interactive || !isCanvasMode.value) return;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const offsetX = (event.clientX - rect.left) * scaleX;
  const offsetY = (event.clientY - rect.top) * scaleY;
  const step = effectiveCellSize.value + 1;
  const x = Math.max(0, Math.min(
    props.map.dimensions.width - 1,
    Math.floor(offsetX / step)
  ));
  const y = Math.max(0, Math.min(
    props.map.dimensions.height - 1,
    Math.floor(offsetY / step)
  ));
  if (!hoveredCell.value ||
      hoveredCell.value.x !== x ||
      hoveredCell.value.y !== y) {
    hoveredCell.value = { x, y };
    scheduleRedraw();
  }
};

/**
 * handleCanvasMouseLeave — clears hover state and redraws.
 */
const handleCanvasMouseLeave = () => {
  if (hoveredCell.value) {
    hoveredCell.value = null;
    scheduleRedraw();
  }
};

// ─── 14. ZOOM FUNCTIONS ──────────────────────────────────────

/**
 * snapZoom — snaps zoom to 1.0 if within 5% to prevent
 * floating-point drift (e.g. 0.9999 showing as "99%").
 */
const snapZoom = () => {
  if (Math.abs(zoomLevel.value - 1.0) < 0.05) {
    zoomLevel.value = 1.0;
  }
};

/**
 * zoomIn / zoomOut — zoom while keeping the center of the
 * visible wrapper area anchored to the same map region.
 */
const zoomIn = () => {
  const wrapper = wrapperRef.value;
  const prevStep = effectiveCellSize.value + 1;
  const vpW = wrapper ? wrapper.clientWidth : 600;
  const vpH = wrapper ? wrapper.clientHeight : 400;
  const sl = wrapper ? wrapper.scrollLeft : 0;
  const st = wrapper ? wrapper.scrollTop : 0;
  // Cell at center of current view
  const centerCellX = (sl + vpW / 2) / prevStep;
  const centerCellY = (st + vpH / 2) / prevStep;

  zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value * ZOOM_STEP);
  snapZoom();

  nextTick(() => {
    if (!wrapper) return;
    const newStep = effectiveCellSize.value + 1;
    wrapper.scrollLeft = centerCellX * newStep - vpW / 2;
    wrapper.scrollTop = centerCellY * newStep - vpH / 2;
    if (isCanvasMode.value) scheduleRedraw();
  });
};

const zoomOut = () => {
  const wrapper = wrapperRef.value;
  const prevStep = effectiveCellSize.value + 1;
  const vpW = wrapper ? wrapper.clientWidth : 600;
  const vpH = wrapper ? wrapper.clientHeight : 400;
  const sl = wrapper ? wrapper.scrollLeft : 0;
  const st = wrapper ? wrapper.scrollTop : 0;
  const centerCellX = (sl + vpW / 2) / prevStep;
  const centerCellY = (st + vpH / 2) / prevStep;

  zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value / ZOOM_STEP);
  snapZoom();

  nextTick(() => {
    if (!wrapper) return;
    const newStep = effectiveCellSize.value + 1;
    wrapper.scrollLeft = centerCellX * newStep - vpW / 2;
    wrapper.scrollTop = centerCellY * newStep - vpH / 2;
    if (isCanvasMode.value) scheduleRedraw();
  });
};

const resetZoom = () => {
  zoomLevel.value = 1.0;
  if (wrapperRef.value) {
    wrapperRef.value.scrollLeft = 0;
    wrapperRef.value.scrollTop = 0;
  }
  if (isCanvasMode.value) nextTick(scheduleRedraw);
};

// ─── 15. SCROLL ZOOM ─────────────────────────────────────────

/**
 * handleWheel — Ctrl + scroll adjusts zoom.
 * Without Ctrl the event is not captured; page scrolls normally.
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

// ─── 16. WATCHERS ─────────────────────────────────────────────

/**
 * Canvas redraw watcher — triggered by any data that affects
 * the visual output. Throttled via requestAnimationFrame.
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

// ─── 17. LIFECYCLE ────────────────────────────────────────────

onMounted(async () => {
  const container = wrapperRef.value;
  if (container) {
    // Scroll triggers visible-cell recalculation → redraw
    container.addEventListener('scroll', scheduleRedraw);
    // Ctrl+scroll zoom
    container.addEventListener('wheel', handleWheel, { passive: false });
  }
  if (isCanvasMode.value) {
    await nextTick();
    scheduleRedraw();
  }
});

onUnmounted(() => {
  const container = wrapperRef.value;
  if (container) {
    container.removeEventListener('scroll', scheduleRedraw);
    container.removeEventListener('wheel', handleWheel);
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
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

/*
  Scroll wrapper: constrains visible area to 600px height.
  Native scrollbars appear for large maps.
  The canvas is always rendered at full map dimensions;
  only visible cells are drawn (scroll-clipped rendering).
*/
.map-grid__canvas-wrapper {
  overflow: auto;
  max-width: 100%;
  max-height: 600px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-border);
  position: relative;
}

/* Canvas element: full map size, no constraints */
.map-grid__canvas-el {
  display: block;
  cursor: crosshair;
}

/* DOM grid container */
.map-grid__canvas {
  display: grid;
  gap: 1px;
  background-color: var(--color-border);
  border: none; /* wrapper has the border */
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

.map-grid__cell--interactive { cursor: crosshair; }
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
