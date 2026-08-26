# Changelog

All notable changes to this project will be documented here.
Format follows Keep a Changelog conventions.

## [Unreleased]

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
