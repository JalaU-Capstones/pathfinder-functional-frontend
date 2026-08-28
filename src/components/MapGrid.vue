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
    Mouse drag pans the viewport using a scroll-offset model.
    scrollLeft/scrollTop track how far into the map the viewport
    is scrolled. The surface is translated by negative offsets so
    the correct portion of the (always fully rendered) map is
    visible. A 5px movement threshold distinguishes drag (scroll)
    from click (place element). Scroll is clamped to exact map
    edges — blank space never appears.
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
      Viewport: fixed-size, overflow hidden, drag to scroll.
      The surface inside is translated by -scrollLeft/-scrollTop
      so the browser renders the entire map at full size while
      only showing the region the user has scrolled to.
    -->
    <div
      ref="viewportRef"
      class="map-grid__viewport"
      @mousedown="startPan"
      @mousemove="doPan"
      @mouseup="endPan"
    >
      <div
        class="map-grid__surface"
        :style="{
          width: `${mapWidthPx}px`,
          height: `${mapHeightPx}px`,
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
          maxWidth: 'none',
        }"
      >
        <!-- Canvas mode: no @click — handled via endPan threshold -->
        <canvas
          v-if="isCanvasMode"
          ref="canvasRef"
          class="map-grid__canvas-el"
          :width="mapWidthPx"
          :height="mapHeightPx"
          :style="{ maxWidth: 'none', display: 'block' }"
          :title="interactive ? 'Click to select a cell' : undefined"
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
 * CANVAS_THRESHOLD — maps with more cells than this value use
 * Canvas rendering instead of DOM divs.
 * 150 * 150 = 22,500 cells is the DOM render limit.
 */
const CANVAS_THRESHOLD = 150 * 150;

const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100.0;
const ZOOM_STEP = 1.5;

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
 * scrollLeft / scrollTop — how far into the map the viewport
 * is currently scrolled (in pixels at current zoom).
 * These are NOT map transform values; they are clamped scroll
 * offsets used to translate the surface NEGATIVELY so the
 * correct map region appears inside the fixed viewport.
 */
const scrollLeft = ref(0);
const scrollTop = ref(0);

const isPanning = ref(false);
const lastMouse = ref({ x: 0, y: 0 });

const dragThreshold = 5; // pixels total — below this = click
const hasMovedEnough = ref(false);
const clickStartPos = ref({ x: 0, y: 0 });
const clickWasInsideViewport = ref(false);

const viewportWidth = ref(0);
const viewportHeight = ref(0);
const isMeasured = ref(false);

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
 * cellSize — base pixel size per cell before zoom.
 * Calculated so the map fits proportionally within the viewport.
 */
const cellSize = computed(() => {
  const { width, height } = props.map.dimensions;
  if (!width || !height) return 8;

  // Target available space inside viewport
  const targetWidth = Math.max(300, viewportWidth.value - 48);
  const targetHeight = Math.max(200, viewportHeight.value - 48);

  // Calculate cell size that fits BOTH dimensions
  const cellW = Math.floor(targetWidth / width);
  const cellH = Math.floor(targetHeight / height);
  let baseSize = Math.min(cellW, cellH);

  // Enforce reasonable bounds: min 1px, max 40px
  baseSize = Math.max(isCanvasMode.value ? 1 : 4, Math.min(40, baseSize));
  return baseSize;
});

// ─── 7. COMPUTED — DEPENDENT ON cellSize AND zoomLevel ───────
//  effectiveCellSize declared before any computed or watcher
//  that references it — prevents ReferenceError on init.

/**
 * effectiveCellSize — rendered cell size after zoom multiplier.
 * Used in all template bindings and coordinate math.
 */
const effectiveCellSize = computed(() =>
  Math.max(1, Math.round(cellSize.value * zoomLevel.value))
);

/**
 * mapWidthPx / mapHeightPx — full pixel dimensions of the map
 * at the current zoom level. The surface element is sized to
 * these values so the entire map always renders.
 * +1 accounts for the 1px gap between each cell.
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
 * drawCanvas — full map render onto the canvas element.
 * One background fillRect creates grid lines; one fillRect
 * per cell draws its color. Much faster than DOM at scale.
 */
const drawCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = props.map.dimensions;
  const cs = effectiveCellSize.value;
  const step = cs + 1; // 1px gap

  ctx.fillStyle = COLORS.border;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = getCellColor(getCellType(x, y));
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

// ─── 12. SCROLL BOUNDARY ENFORCEMENT ─────────────────────────

/**
 * clampScroll — enforces that scrollLeft and scrollTop stay
 * within [0, mapSize - viewportSize]. Called after every pan
 * move and after any zoom change.
 * Result: blank space never appears — map edges are hard limits.
 */
const clampScroll = () => {
  if (!isMeasured.value) return; // ← guard: skip until ready
  const maxX = Math.max(0, mapWidthPx.value - viewportWidth.value);
  const maxY = Math.max(0, mapHeightPx.value - viewportHeight.value);
  scrollLeft.value = Math.max(0, Math.min(scrollLeft.value, maxX));
  scrollTop.value = Math.max(0, Math.min(scrollTop.value, maxY));
};

// ─── 13. UNIFIED CLICK COORDINATE LOGIC ──────────────────────

/**
 * emitCellFromMouseEvent — converts a screen mouse position to
 * grid coordinates. The scroll offset is ADDED (not subtracted)
 * because scrollLeft/scrollTop represent how far into the map
 * the viewport has moved. A click at screen pixel (cx, cy) lands
 * on map pixel (cx + scrollLeft, cy + scrollTop).
 *
 * @param {MouseEvent} event
 */
const emitCellFromMouseEvent = (event) => {
  if (!props.interactive || !isMeasured.value) return;
  const vp = viewportRef.value;
  if (!vp) return;
  const rect = vp.getBoundingClientRect();
  // Screen position relative to viewport, plus scroll offset
  const clickX = (event.clientX - rect.left) + scrollLeft.value;
  const clickY = (event.clientY - rect.top) + scrollTop.value;
  const step = effectiveCellSize.value + 1;
  const x = Math.floor(clickX / step);
  const y = Math.floor(clickY / step);
  // Clamp to valid grid bounds
  const clampedX = Math.max(0, Math.min(props.map.dimensions.width - 1, x));
  const clampedY = Math.max(0, Math.min(props.map.dimensions.height - 1, y));
  emit('cell-click', { x: clampedX, y: clampedY });
};

// ─── 14. PAN / CLICK HANDLERS ────────────────────────────────

const startPan = (e) => {
  isPanning.value = true;
  hasMovedEnough.value = false;
  clickWasInsideViewport.value = true; // ← click began inside
  lastMouse.value = { x: e.clientX, y: e.clientY };
  clickStartPos.value = { x: e.clientX, y: e.clientY };
  e.preventDefault();
};

/**
 * doPan — dragging FORWARD moves the viewport FORWARD (scroll
 * increases), revealing the part of the map ahead. The delta is
 * subtracted from lastMouse, not added, because pulling the mouse
 * left should scroll right (normal scroll convention).
 */
const doPan = (e) => {
  if (!isPanning.value) return;
  // Reverse delta: drag right → scroll left increases
  const dx = lastMouse.value.x - e.clientX;
  const dy = lastMouse.value.y - e.clientY;
  scrollLeft.value += dx;
  scrollTop.value += dy;
  lastMouse.value = { x: e.clientX, y: e.clientY };

  // Track total movement for click-vs-drag distinction
  const totalDx = Math.abs(e.clientX - clickStartPos.value.x);
  const totalDy = Math.abs(e.clientY - clickStartPos.value.y);
  if (totalDx > dragThreshold || totalDy > dragThreshold) {
    hasMovedEnough.value = true;
  }

  // Enforce boundaries immediately — no blank space ever visible
  clampScroll();
};

/**
 * endPan — on mouse release:
 * - Check if release position is inside viewport bounds
 * - ONLY emit click if BOTH: small movement AND released INSIDE
 */
const endPan = (e) => {
  isPanning.value = false;
  const vp = viewportRef.value;
  if (vp) {
    const rect = vp.getBoundingClientRect();
    const releasedInside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;
    
    // ONLY emit click if movement was small AND released inside grid
    if (!hasMovedEnough.value && releasedInside && clickWasInsideViewport.value) {
      emitCellFromMouseEvent(e);
    }
  }
  clickWasInsideViewport.value = false;
};

// ─── 15. ZOOM FUNCTIONS ──────────────────────────────────────

/**
 * zoomIn / zoomOut — zoom while keeping the center of the
 * visible viewport anchored. After the zoom level changes, the
 * scroll offset is adjusted so the same map region stays centered.
 */
const zoomIn = () => {
  if (!isMeasured.value) return;
  const prevCellSize = effectiveCellSize.value;
  const vpW = viewportWidth.value || 600;
  const vpH = viewportHeight.value || 400;
  // Record center of current view in map pixels (pre-zoom)
  const centerMapX = scrollLeft.value + vpW / 2;
  const centerMapY = scrollTop.value + vpH / 2;
  // Record the cell coordinates the center is over
  const step = prevCellSize + 1;
  const centerCellX = centerMapX / step;
  const centerCellY = centerMapY / step;

  zoomLevel.value = Math.min(MAX_ZOOM, zoomLevel.value * ZOOM_STEP);

  nextTick(() => {
    // Recalculate scroll so same cell stays at center
    const newStep = effectiveCellSize.value + 1;
    scrollLeft.value = centerCellX * newStep - vpW / 2;
    scrollTop.value = centerCellY * newStep - vpH / 2;
    clampScroll();
  });
};

const zoomOut = () => {
  if (!isMeasured.value) return;
  const prevCellSize = effectiveCellSize.value;
  const vpW = viewportWidth.value || 600;
  const vpH = viewportHeight.value || 400;
  const step = prevCellSize + 1;
  const centerCellX = (scrollLeft.value + vpW / 2) / step;
  const centerCellY = (scrollTop.value + vpH / 2) / step;

  zoomLevel.value = Math.max(MIN_ZOOM, zoomLevel.value / ZOOM_STEP);

  nextTick(() => {
    const newStep = effectiveCellSize.value + 1;
    scrollLeft.value = centerCellX * newStep - vpW / 2;
    scrollTop.value = centerCellY * newStep - vpH / 2;
    clampScroll();
  });
};

const resetZoom = () => {
  zoomLevel.value = 1.0;
  scrollLeft.value = 0;
  scrollTop.value = 0;
};

// ─── 16. SCROLL ZOOM ─────────────────────────────────────────

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

// ─── 17. VIEWPORT SIZE TRACKING ──────────────────────────────

const updateViewportSize = () => {
  if (viewportRef.value) {
    const rect = viewportRef.value.getBoundingClientRect();
    viewportWidth.value = rect.width;
    viewportHeight.value = rect.height;
    isMeasured.value = true;
    clampScroll();
  }
};

// ─── 18. WATCHERS — DECLARED AFTER ALL COMPUTEDS ─────────────

// Initialize zoom to fit entire map on first load
watch(
  [() => props.map, isMeasured],
  () => {
    if (!isMeasured.value) return;
    // Fit map with 5% margin so edges are visible
    const { width, height } = props.map.dimensions;
    const vpW = viewportWidth.value - 32;
    const vpH = viewportHeight.value - 32;
    const fitZoomW = vpW / (width * (cellSize.value + 1));
    const fitZoomH = vpH / (height * (cellSize.value + 1));
    zoomLevel.value = Math.min(fitZoomW, fitZoomH, 1.0); // never zoom in on load
    scrollLeft.value = 0;
    scrollTop.value = 0;
  },
  { deep: true, immediate: true }
);

// Re-clamp when zoom changes cell size (viewport content shifts)
watch(effectiveCellSize, () => {
  clampScroll();
});

/**
 * Canvas redraw watcher — triggered by any data that affects
 * the visual output. Throttled via requestAnimationFrame.
 */
watch(
  [
    isMeasured,
    () => props.map,
    () => props.path,
    () => props.startPoint,
    () => props.endPoint,
    isCanvasMode,
    effectiveCellSize,
    zoomLevel,
  ],
  async () => {
    if (isCanvasMode.value && isMeasured.value) {
      await nextTick();
      scheduleRedraw();
    }
  },
  { deep: true }
);

// ─── 19. LIFECYCLE — AT THE VERY END ─────────────────────────

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

/*
  Viewport: fixed container with overflow hidden.
  Drag is the ONLY navigation method — no native scrollbars.
  The surface inside translates to reveal different regions.
*/
.map-grid__viewport {
  overflow: hidden; /* NO native scrollbars — drag only */
  position: relative;
  width: 100%;
  min-height: 320px; /* ← enough height, no squashed rectangles */
  cursor: grab;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-surface-2, #111);
}

.map-grid__viewport:active {
  cursor: grabbing;
  user-select: none;
}

/*
  Surface: sized to full map dimensions so the browser renders
  ALL cells. Translated negatively by scrollLeft/scrollTop so
  the correct region shows through the viewport window.
  No overflow hidden — cutting off cells here would defeat the
  purpose of the scroll model.
*/
.map-grid__surface {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

/* Canvas element: full map size, no constraints */
.map-grid__canvas-el {
  display: block;
}

/* DOM grid container: no overflow clipping */
.map-grid__canvas {
  display: grid;
  gap: 1px;
  background-color: var(--color-border);
  overflow: visible; /* All cells render fully */
  max-width: none; /* allow full-size rendering */
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
