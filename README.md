# Pathfinder Frontend

Web interface for the Pathfinder Functional Backend API.
Built with Vue 3 and Vite. Provides interactive map
visualization, A* pathfinding route calculation, and full
CRUD management for all backend entities.

The application uses a dark theme with a cyan accent palette.
All map grids support zoom and are rendered with a dual
strategy: DOM elements for small maps and HTML5 Canvas for
large maps (above 22,500 cells), preventing browser freezes
on grids up to 10,000 x 10,000.

## Related Repository

Backend API:
https://github.com/JalaU-Capstones/pathfinder-functional-backend

The backend must be running at http://localhost:3000 before
starting the frontend development server.

## Tech Stack

- Framework: Vue 3 (Composition API)
- Build tool: Vite
- Language: JavaScript
- Router: Vue Router 4
- Styling: Custom CSS design system (CSS custom properties)
- HTTP: Native fetch API (no axios)
- Rendering: DOM divs (small maps) / HTML5 Canvas (large maps)

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Pathfinder backend running at http://localhost:3000

## Getting Started

### Clone the repository

Linux/macOS:

```bash
git clone https://github.com/JalaU-Capstones/pathfinder-functional-frontend.git
cd pathfinder-functional-frontend
```

Windows (PowerShell):

```powershell
git clone https://github.com/JalaU-Capstones/pathfinder-functional-frontend.git
cd pathfinder-functional-frontend
```

### Install dependencies

```bash
npm install
```

### Configure environment

Linux/macOS:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
copy .env.example .env
```

The default configuration proxies all `/api/*` requests
to `http://localhost:3000`. Edit `.env` only if the
backend runs on a different port.

### Start the backend

Before running the frontend, start the backend:

```bash
cd ../pathfinder-functional-backend
docker compose up -d
npm run dev
```

### Start the frontend development server

```bash
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |

## Application Views

### Home

Landing page showing backend connection status with a live
health check that polls every 30 seconds. Navigation cards
link to each section.

### Maps

Create, view, edit, and delete maps. Each map has
configurable width and height dimensions. When creating a
map, obstacles and waypoints can optionally be added in the
same request (atomic creation). Selecting a map renders its
grid with obstacles (red) and waypoints (yellow).

### Obstacles

Add, edit, and delete obstacles on maps. Coordinates can be
entered manually or by clicking directly on the map grid
(toggle between Form and Grid placement mode). After each
change, a live map preview updates to show the new obstacle
configuration.

### Waypoints

Add, edit, and delete waypoints (stopping points) on maps.
Supports the same Form and Grid placement modes as Obstacles.
Waypoints are required for A* route calculation.

### Routes

Calculate optimal routes using the A* algorithm. Select a
map, click two cells on the grid to set the start (green)
and end (purple) points, then click Calculate Route. The
computed path animates cell by cell in cyan on the grid,
with a progress bar and distance statistics. Previously
calculated routes are available in the Saved Routes tab.

### Users

Full CRUD management for user accounts. Create, edit, and
delete users. Email uniqueness is enforced with a 409
Conflict error on duplicates.

### Validation

Interactive panel for running backend validation operations:

- UUID format validation (recursive segment-by-segment)
- Map existence check (async database query)
- Waypoint reachability analysis (accumulator pattern)
- Same-point detection (start equals end special case)
- Cyclic dependency detection (DFS traversal)

## Map Grid

### Rendering strategy

Maps with 22,500 cells or fewer (up to approximately 150x150)
render as DOM div elements. Maps above this threshold render
on a single HTML5 Canvas element. Canvas rendering handles
maps up to 10,000x10,000 without freezing the browser.

### Zoom

Every map grid has independent zoom controls:

- Click + to zoom in (up to 800%)
- Click - to zoom out (down to 25%)
- Click the percentage label to reset to 100%
- Hold Ctrl and scroll the mouse wheel over the grid to zoom

Zoom works in both DOM and Canvas rendering modes.

### Cell colors

| Color | Meaning |
|---|---|
| Dark grey | Empty cell |
| Red | Obstacle |
| Yellow | Waypoint |
| Cyan | A* computed path |
| Green | Route start point |
| Purple | Route end point |

## Design System

All design tokens (colors, spacing, typography, border radius,
shadows, transitions) are defined as CSS custom properties in
`src/style.css`. No component hardcodes a color value.

Typography: Inter (UI text), JetBrains Mono (coordinates
and UUIDs).

Theme: dark background (#0a0e1a) with cyan accent (#06b6d4).

## Project Structure

```
src/
  api/           HTTP client for each backend entity
  components/    Reusable Vue components
  router/        Vue Router configuration
  views/         Page-level components (one per route)
  style.css      Global design tokens and base styles
  main.js        Application entry point
  App.vue        Root component
```

### Components

| Component | Purpose |
|---|---|
| AppHeader | Fixed top bar with brand and backend status |
| AppSidebar | Fixed left navigation with active route highlight |
| AppLayout | Layout wrapper used by all views |
| StatusBadge | Colored dot and label for connection status |
| MapGrid | Interactive grid with dual DOM/Canvas rendering |
| ZoomControls | Zoom in/out/reset toolbar for map grids |
| MapCard | Map summary card with select/edit/delete actions |
| MapForm | Create/edit map form with inline obstacle/waypoint builder |
| RouteForm | Route calculation form with interactive grid cell selection |
| RouteResult | Animated A* path display with distance statistics |
| RouteCard | Saved route card |
| ObstacleForm | Create/edit obstacle form with Form and Grid modes |
| WaypointForm | Create/edit waypoint form with Form and Grid modes |
| EntityTable | Reusable data table with edit and delete actions |
| UserForm | Create/edit user form |
| ValidationPanel | Backend validation operation runner |
| BaseButton | Button with primary/secondary/danger/ghost variants |
| BaseInput | Labeled input with error and hint slots |
| BaseAlert | Dismissible alert for success/error/warning/info |

## API Communication

All HTTP requests go through `src/api/client.js`, which
wraps the native fetch API with error normalization and
JSON parsing. Vite's dev server proxies `/api/*` requests
to `http://localhost:3000` during development, eliminating
CORS issues.

API modules by entity:

| Module | Endpoints covered |
|---|---|
| `maps.js` | GET, POST, PUT, DELETE /api/maps |
| `obstacles.js` | GET, POST, PUT, DELETE /api/obstacles |
| `waypoints.js` | GET, POST, PUT, DELETE /api/waypoints |
| `routes.js` | GET, POST, DELETE /api/routes |
| `users.js` | GET, POST, PUT, DELETE /api/users |
| `validation.js` | All /api/validation/* endpoints |

## License

MIT License. Copyright (c) 2026 CodeWithBotinaOficial.
See LICENSE for details.
