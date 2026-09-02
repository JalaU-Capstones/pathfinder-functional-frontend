# Changelog

## 2026-08-31

fix(router): fix redirect after login — use
  router.currentRoute.value.query.redirect instead of
  route.query.redirect to get the correct value
  after navigation completes
fix(router): remove auth:required window listener from
  router — moved to AuthModal component (SRP)
feat(views): add StatsView consuming all four
  /stats/* backend endpoints with bar chart,
  method table, response times and status code grid
feat(components): add AuthModal shown on auth:required
  browser event for mid-session token expiry
feat(api): add stats.js API module for all four
  /stats/* endpoints
feat(router): add /stats route to router
feat(components): add Stats nav item to AppSidebar
feat(views): add Stats card to HomeView sections grid

All notable changes to this project will be documented here.
Format follows Keep a Changelog conventions.

## [Unreleased]

## [0.1.7] - 2026-08-31

### Added
- refactor(home): update Users card to Profile linking to /profile
- fix(sidebar): use BaseButton for logout with global styling
- feat(views): add ProfileView replacing UsersView —
  shows authenticated user's own profile only
- feat(api): update users.js to /me endpoints matching
  the backend auth implementation
- refactor(router): rename users route to profile,
  update path from /users to /profile
- refactor(components): update sidebar Users nav item
  to Profile with single-person icon
- feat(auth): add tokenStore with localStorage JWT
  management, expiration check and payload decoder
- feat(auth): add auth API module with register, login
  and logout functions
- feat(api): update client to include Authorization header
  on every request when token is present
- feat(api): handle 401 responses by clearing token and
  emitting auth:required browser event
- fix(auth): move TOKEN_KEY from hardcoded string to
  VITE_TOKEN_KEY environment variable
- feat(views): add AuthView with Login and Register tabs
- feat(router): add /auth route and beforeEach guard
  redirecting unauthenticated users
- feat(router): listen for auth:required event to handle
  mid-session token expiry
- feat(components): add logout button and user email
  display to AppSidebar
- fix(ui): correct logout button styling to match sidebar theme
- fix(ui): improve AuthView responsiveness on mobile screens

### Fixed
- fix(mapgrid): square cell formula — cellSize = min(MAX_GRID_PX/width,
  MAX_GRID_PX/height) clamped to [1,40]; grid always fits 600×600px on
  both axes simultaneously; cells are always square regardless of map shape
- fix(mapgrid): canvas click coordinate accuracy — click handler now uses
  effectiveCellSize (zoomed) in step math instead of base cellSize; clicks
  at any zoom level target the correct cell
- fix(mapgrid): zoom step reduced from 1.5× to 1.25× for smoother
  progression (100% → 125% → 156% → 195% → ...)
- fix(mapgrid): zoom snap — zoomLevel snaps to exactly 1.0 when within
  5% of 1.0, eliminating floating-point drift ("99%" showing as "100%")
- fix(mapgrid): canvas scroll clipping — drawCanvas now reads the native
  scroll container's scrollLeft/scrollTop to calculate visible cell range;
  only cells in the current viewport are drawn; 1000×1000 map (~1M cells)
  renders ~6,000 visible cells instead of 1,000,000
- fix(mapgrid): scroll listener — container scroll event triggers
  scheduleRedraw so canvas re-clips on every scroll without freezing
- fix(mapgrid): canvas hover highlight — in interactive canvas mode a
  white semi-transparent overlay (rgba 255,255,255,0.25) tracks the cursor
  cell by cell; disappears on mouseleave
- fix(mapgrid): replaced custom drag-to-pan system with native
  overflow:auto scroll wrapper; ZoomControls center-anchor reads native
  scrollLeft/scrollTop from the wrapper element
- fix(zoomcontrols): use toFixed(0) instead of Math.round for zoom
  percentage display — prevents "99%" artifact for 0.9999 zoom values
- fix(mapcard): add renderingMode computed badge (DOM/Canvas) next to
  map dimension text — green badge for DOM maps ≤22,500 cells,
  blue badge for Canvas maps >22,500 cells

## [0.1.6] - 2026-08-24

### Changed
- docs: rewrite README with accurate current project state,
  all views documented, dual rendering and zoom explained

### Added
- docs(reports): add assignment 8.4 progress report

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
