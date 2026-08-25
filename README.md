# Pathfinder Frontend

Web interface for the Pathfinder backend API. Built with
Vue 3 and Vite. Provides an interactive visual grid for
map exploration, A* pathfinding visualization, and full
CRUD management for all backend entities.

## Related Repository

Backend API: https://github.com/JalaU-Capstones/pathfinder-functional-backend

The backend must be running at http://localhost:3000
before starting the frontend development server.

## Tech Stack

- Framework: Vue 3 (Composition API)
- Build tool: Vite
- Language: JavaScript
- Router: Vue Router 4
- Styling: Custom CSS design system (CSS custom properties)
- HTTP: Native fetch API

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Pathfinder backend running at http://localhost:3000

## Getting Started

### Clone the repository

Linux/macOS:
git clone https://github.com/JalaU-Capstones/pathfinder-functional-frontend.git
cd pathfinder-functional-frontend

Windows (PowerShell):
git clone https://github.com/JalaU-Capstones/pathfinder-functional-frontend.git
cd pathfinder-functional-frontend

### Install dependencies

npm install

### Configure environment

Copy the example environment file and adjust if needed:

Linux/macOS:
cp .env.example .env

Windows (PowerShell):
copy .env.example .env

### Start the development server

npm run dev

The application will be available at http://localhost:5173

API requests are proxied to http://localhost:3000 via
Vite's proxy configuration. No CORS setup required during
development.

## Available Scripts

| Script | Description |
|---|---|
| npm run dev | Start development server with hot reload |
| npm run build | Build for production |
| npm run preview | Preview the production build locally |
| npm run lint | Run ESLint |

## Project Structure

src/
  api/          HTTP client functions for each backend entity
  assets/       Static assets (images, fonts)
  components/   Reusable Vue components
  router/       Vue Router configuration
  views/        Page-level components (one per route)
  style.css     Global design tokens and base styles
  main.js       Application entry point
  App.vue       Root component with router outlet

## Design System

The application uses a dark theme with a cyan accent palette.
All design tokens (colors, spacing, typography) are defined
as CSS custom properties in src/style.css. No component
should hardcode a color value.

## License

MIT License. Copyright (c) 2026 CodeWithBotinaOficial.
See LICENSE for details.
