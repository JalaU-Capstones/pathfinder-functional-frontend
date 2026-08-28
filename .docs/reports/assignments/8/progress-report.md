# Assignment 8.4 - Capstone Progress Report

Project: Pathfinder Frontend
Student: Diego Alejandro Botina
GitHub (Frontend):
  https://github.com/JalaU-Capstones/pathfinder-functional-frontend
GitHub (Backend):
  https://github.com/JalaU-Capstones/pathfinder-functional-backend
Deliverable Branch (Assignment 8.4):
  https://github.com/JalaU-Capstones/pathfinder-functional-frontend/tree/deliverable/assigment8-4
Period: August 24, 2026
Course: Programming 4 - Jala University

> Note: The code delivered for Assignment 8.4 is frozen in:
> deliverable/assigment8-4
> This branch was created from main after all phases of this
> assignment were merged, preserving a snapshot for evaluation.

## 1. Introduction

Assignment 8.4 required implementing a functional and
user-friendly interface for the Pathfinder backend application,
ensuring an intuitive and efficient experience. The interface
must display maps, visualize routes (start and end), obstacles,
and waypoints, and integrate all the rules and validations
implemented in the backend in previous weeks.

The chosen implementation is a web application built with
Vue 3 and Vite, consuming the existing REST API via the Vite
dev server proxy.

## 2. What Was Implemented

| Phase | Feature | Status |
|---|---|---|
| 15A | Vue 3 + Vite project initialization, design system, router | Complete |
| 15B | API client layer (fetch wrapper + entity modules) | Complete |
| 15C | Application shell: header, sidebar, navigation, home view | Complete |
| 15D | Maps view with interactive grid visualization | Complete |
| 15E | Routes view with A* path animation | Complete |
| 15F | Obstacles, Waypoints, Users, Validation views | Complete |
| 15F-Fix-A | Responsive layout, sidebar collapse on mobile | Complete |
| 15F-Fix-B | Canvas rendering for large maps (DOM/Canvas dual strategy) | Complete |
| 15F-Fix-C | PUT (edit) endpoints for all four entities | Complete |
| 15F-Fix-D | MapForm inline obstacle and waypoint creation | Complete |
| 15F-Fix-E | Zoom system and grid click placement mode | Complete |

## 3. Assignment Rubric Requirements

### Desktop UI

The application is a responsive web application accessible
from any modern browser. It does not require installation.
The layout uses a fixed sidebar (collapses on narrow viewports)
and a fixed header with live backend connection status.

### Interface Integration

All backend rules and validations from previous weeks are
integrated:

| Backend Feature | Frontend Integration |
|---|---|
| Map CRUD | Maps view: create with inline obstacles/waypoints, list, grid visualization, edit, delete |
| Obstacle CRUD | Obstacles view: form mode + grid click placement, live preview, edit, delete |
| Waypoint CRUD | Waypoints view: same as obstacles with name field |
| Route CRUD with A* | Routes view: interactive grid cell selection, path animation, saved routes |
| User CRUD | Users view: create, edit (with duplicate email handling), delete |
| UUID validation (recursive) | Validation view: UUID format check panel |
| Map existence check | Validation view: map exists panel |
| Waypoint reachability (accumulator) | Validation view: reachability check panel |
| Same-point detection | Validation view: same-point check panel |
| Cyclic dependency detection (DFS) | Validation view: cyclic dependencies panel |
| Map configuration validation | Checked before route creation |
| Waypoint compliance (post-A*) | Error shown if path cannot satisfy waypoints |

## 4. Map Grid Technical Decisions

### Dual Rendering Strategy

The map grid uses two rendering approaches selected
automatically based on map size:

DOM mode (maps up to 150 x 150 = 22,500 cells):
Renders each cell as a div element. Supports CSS hover
effects, Vue transitions, click events, and keyboard
accessibility. Used for all interactive grids where the
user clicks cells to select coordinates.

Canvas mode (maps above 22,500 cells):
Renders the entire grid on a single HTML5 Canvas element
using the Canvas 2D API. No DOM elements are created for
individual cells. A 1,000 x 1,000 map (1,000,000 cells)
renders in approximately 50ms. Click events are handled by
converting mouse coordinates to grid coordinates via
arithmetic rather than DOM events.

The threshold (22,500 cells) was chosen as the practical
limit beyond which DOM rendering causes visible browser
freezes during testing.

### Zoom System

Every map grid has independent zoom controls. Zoom is a
multiplier applied to the auto-calculated base cell size:

  effectiveCellSize = baseCellSize * zoomLevel

Minimum zoom: 25%. Maximum zoom: 800%. Step: x1.5 per click.
Ctrl + mouse wheel also adjusts zoom while hovering the grid.

Zoom works in both DOM and Canvas modes. In Canvas mode,
changing the zoom re-renders the canvas at the new
effectiveCellSize. Click coordinate math accounts for CSS
scaling via scaleX = canvas.width / rect.width.

## 5. Functional Programming in the Frontend

The frontend applies functional programming principles
consistent with the backend:

Pure functions: getCellType, getCellColor, validate functions
in all forms. Same input always produces same output.

Immutability: all list updates use spread syntax or filter
to return new arrays rather than mutating existing ones.
Example: obstacles.value = [...obstacleList, newItem].

Computed properties: Vue computed() is a memoized pure
function. All derived state (effectiveCellSize, previewMap,
obstacleSet, pathSet) is computed, never mutated manually.

Higher-order functions: Array.map(), filter(), reduce(),
find() used throughout for data transformation. No for loops
in component logic.

## 6. Component Architecture

The application follows a component hierarchy:

AppLayout (shell)
  AppHeader (backend status, navigation toggle)
  AppSidebar (route links, active state)
  [View] (page-level, one per route)
    Base components (BaseButton, BaseInput, BaseAlert)
    Entity components (MapGrid, MapCard, MapForm, ...)

18 components total. Each has a single responsibility:
MapGrid renders the grid. ZoomControls handles zoom state.
RouteResult animates the path. No component does two jobs.

## 7. AI-Assisted Development

Development of the frontend followed the same AI-assisted
workflow used throughout the capstone.

Claude (Anthropic) designed the full frontend architecture:
the phase plan (15A through 15G), the dual DOM/Canvas
rendering strategy for MapGrid, the zoom implementation using
effectiveCellSize multiplier, the grid click placement mode
for obstacles and waypoints, the responsive sidebar collapse
system, the design system tokens, and the component hierarchy.
Claude authored the detailed phase-by-phase implementation
prompts used as specifications.

Gemini 2.5 Flash (Google) executed the implementation: all
Vue SFC components, scoped styles, computed properties,
watchers, event handlers, Canvas 2D API drawing code, and
the Vite proxy configuration.

All generated output was reviewed in the browser and
corrected before committing. The architectural decisions,
design token choices, and rendering strategy reflected in
this codebase were made deliberately before any code was
written.

## 8. Conclusion

Assignment 8.4 is complete. The Pathfinder frontend is a
fully functional web application that integrates all backend
features implemented across Assignments 2.4 through 7.4.
The map grid handles maps of any size without freezing,
supports zoom, and allows interactive cell selection. All
four entities support full CRUD via a consistent, professional
dark-theme UI. The application is responsive and works on
any modern browser without installation.
