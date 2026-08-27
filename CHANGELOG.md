# Changelog

All notable changes to this project will be documented here.
Format follows Keep a Changelog conventions.

## [Unreleased]

### Added
- feat(zoom): extend zoom range to 1%–10000% — view entire million-cell
  maps or zoom in to clearly see individual cells
- feat(mapgrid): add drag-to-pan navigation — click and drag to explore
  any region of the map after zooming in

### Fixed
- fix(mapgrid): reorder script declarations — effectiveCellSize now
  declared before any computed or watcher that references it,
  eliminating the ReferenceError on component load
- fix(mapgrid): remove native scrollbars — mouse drag is sole navigation
- fix(mapgrid): distinguish click vs drag — quick click places element,
  drag pans; threshold is 5px of total movement
- fix(mapgrid): unified coordinate math — single emitCellFromMouseEvent
  path subtracts pan offset before converting to grid coords, so clicks
  target correct cell regardless of zoom and pan
- fix(mapgrid): clamp pan to map boundaries — map cannot be dragged
  completely out of view; max 10% overhang on any edge
- perf(mapgrid): eliminate separate handleCanvasClick and handleDomClick
  — one code path removes the desync between DOM and Canvas modes

## [0.1.5] - 2026-08-24

### Added
- feat(components): add MapGrid zoom system with +/-/reset
  controls and Ctrl+scroll wheel support
- feat(components): add ZoomControls reusable component
- feat(components): add grid click placement mode to
  ObstacleForm and WaypointForm as alternative to
  manual coordinate entry
- feat(ux): all map grids now support independent zoom
  levels persisted per component instance

## [0.1.4] - 2026-08-24

### Added
- feat(components): extend MapForm to optionally include
  obstacles and waypoints during map creation
- feat(components): add inline obstacle and waypoint
  builders with validation, duplicate detection,
  and live grid preview
- feat(components): collapsible optional section in
  MapForm with item count badge on toggle button
- feat(views): update map create handler to show obstacle
  and waypoint counts in success message

## [0.1.3-patch.1] - 2026-08-24

### Fixed
- fix(obstacles): include mapId in edit submit payload to resolve validation error
- fix(waypoints): include mapId in edit submit payload to resolve validation error

### Details
- ObstaclesView.vue: handleUpdateObstacle now forwards the full payload object
  to updateObstacle instead of a manually reconstructed object that omitted mapId
- WaypointsView.vue: handleUpdateWaypoint now forwards the full payload object
  to updateWaypoint instead of a manually reconstructed object that omitted mapId
- Both form components already emitted mapId; the bug was solely in the view
  layer stripping it before the API call

## [0.1.3] - 2026-08-24

### Added
- feat(maps): add edit functionality for map name and dimensions
- feat(obstacles): add edit functionality for obstacle position and size
- feat(waypoints): add edit functionality for waypoint name and position
- feat(components): add Edit button to EntityTable and MapCard components
- fix(users): verify and fix user edit functionality

### Details
- MapForm, ObstacleForm, WaypointForm now accept initialData and editMode
  props; form title, submit label, and Cancel button adapt to mode
- ObstacleForm and WaypointForm show map as read-only text in edit mode
  instead of a dropdown (mapId cannot change on update)
- MapCard now has Edit and Delete buttons rendered side by side
- EntityTable now has Edit and Delete buttons in the actions column with
  spacing; Edit emits 'edit' with the row object
- MapsView: startEditMap, handleUpdateMap, cancelEdit wired to PUT endpoint;
  only one form (create or edit) visible at a time; edit panel has cyan border
- ObstaclesView: startEditObstacle, handleUpdateObstacle, cancelEditObstacle
  wired to PUT endpoint; map preview refreshes after position/size change
- WaypointsView: startEditWaypoint, handleUpdateWaypoint, cancelEditWaypoint
  wired to PUT endpoint; map preview refreshes after name/position change
- UsersView: verified all edit checkpoints pass; added accent border to edit
  form panel to distinguish it from the create form

## [0.1.2] - 2026-08-24

### Fixed
- fix(components): rewrite MapGrid with dual DOM/Canvas
  rendering strategy to prevent browser freeze on large maps
- fix(performance): maps above 150x150 now render via Canvas
  2D API instead of DOM divs, eliminating the freeze on
  1000x1000+ maps
- feat(components): canvas click handler converts mouse
  coordinates to grid cells for interactive mode support
## [0.1.1] - 2026-08-24

### Fixed
- fix(layout): make all views responsive with no
  horizontal scroll
- fix(layout): collapse sidebar on viewports below 900px
  with hamburger toggle
- fix(layout): stack two-column layouts to single column
  on narrow viewports
- fix(components): add overflow and max-width guards to
  MapGrid, EntityTable and view containers
### Added
- ObstaclesView and WaypointsView implemented with forms and grid preview.
- UsersView implemented with create, edit, and delete functionality.
- ValidationView demonstrating multiple backend validation operations.
- EntityTable, ObstacleForm, WaypointForm, and UserForm reusable components.
- RouteForm component with map dropdown, interactive grid cell
  selection state machine (start / end / reset), and validation
- RouteResult component with cell-by-cell A* path animation at
  30ms per step, progress bar, and distance/path-length stats panel
- RouteCard component for saved routes list with start/end
  coordinates color-coded (green start, purple end), distance,
  and delete action
- RoutesView implemented with Calculate and Saved tabs, full
  A* route creation flow, animated path on result grid, saved
  route browsing with static path display, and delete support
- BaseButton, BaseInput, and BaseAlert reusable components
- MapGrid component for visualizing map cells, obstacles, and waypoints
- MapCard component for the maps list
- MapForm component for creating new maps
- MapsView implemented with interactive grid, creation, and deletion functionality
- AppHeader component with brand, live backend health
  check polling every 30 seconds, and API Docs link
- AppSidebar component with navigation links and active
  route highlighting using Vue Router
- AppLayout component wrapping header, sidebar and content
  slot for all views
- StatusBadge reusable component with online, offline,
  checking and error states and pulse animation
- HomeView replaced placeholder with live backend status
  and navigation cards for all sections
- src/api/client.js: base fetch wrapper with normalized
  error handling and JSON parsing
- src/api/maps.js: full CRUD client for Map entity
- src/api/obstacles.js: full CRUD client for Obstacle entity
- src/api/waypoints.js: full CRUD client for Waypoint entity
- src/api/routes.js: CRUD client for Route entity including
  A* route creation
- src/api/users.js: full CRUD client for User entity
- src/api/validation.js: client for all validation endpoints
- src/api/index.js: barrel export for clean imports

## [0.1.0] - 2026-08-24

### Added
- Vue 3 + Vite project scaffold
- Vue Router 4 with routes for Maps, Routes, Users,
  Validation and placeholder views for each
- Global design system with dark theme and cyan accent
  palette (src/style.css)
- Vite dev server proxy to backend at localhost:3000
- MIT License (CodeWithBotinaOficial)
- Initial README with setup instructions
- .gitignore for Node.js and Vite projects
- .env.example with backend URL configuration
