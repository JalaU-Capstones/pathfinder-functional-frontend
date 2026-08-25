# Changelog

All notable changes to this project will be documented here.
Format follows Keep a Changelog conventions.

## [Unreleased]

### Added
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
