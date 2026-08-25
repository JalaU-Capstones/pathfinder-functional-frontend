# Decisions Log

## Vite Dev Server Proxy
We configured Vite to proxy `/api` requests to `http://localhost:3000` during development.
This is critical because it avoids CORS issues when both the frontend and backend run locally.
The frontend simply calls `/api/*` and Vite forwards it transparently to the backend. No CORS configuration is needed on the backend.
