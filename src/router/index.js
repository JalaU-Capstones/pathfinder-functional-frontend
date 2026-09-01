import { createRouter, createWebHistory } from 'vue-router';
import { tokenStore } from '../auth/tokenStore.js';

/**
 * Application routes.
 * Each route corresponds to a main section of the UI.
 * Views are lazy-loaded to keep the initial bundle small.
 */
const routes = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/AuthView.vue'),
    meta: {
      title: 'Sign In',
      public: true, // Flag: does not require authentication
    },
  },
  {
    path: '/',
    name: 'home',
    // Placeholder — replaced in Phase 15C with HomeView
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Pathfinder' },
  },
  {
    path: '/maps',
    name: 'maps',
    component: () => import('../views/MapsView.vue'),
    meta: { title: 'Maps' },
  },
  {
    path: '/obstacles',
    name: 'obstacles',
    component: () => import('../views/ObstaclesView.vue'),
    meta: { title: 'Obstacles' },
  },
  {
    path: '/waypoints',
    name: 'waypoints',
    component: () => import('../views/WaypointsView.vue'),
    meta: { title: 'Waypoints' },
  },
  {
    path: '/routes',
    name: 'routes',
    component: () => import('../views/RoutesView.vue'),
    meta: { title: 'Routes' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UsersView.vue'),
    meta: { title: 'Users' },
  },
  {
    path: '/validation',
    name: 'validation',
    component: () => import('../views/ValidationView.vue'),
    meta: { title: 'Validation' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '404 Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isPublic = to.meta?.public === true;
  const authenticated = tokenStore.isAuthenticated();

  // Unauthenticated user going to a protected route:
  // redirect to /auth and remember where they wanted to go
  if (!isPublic && !authenticated) {
    return next({
      name: 'auth',
      query: { redirect: to.fullPath },
    });
  }

  // Authenticated user going to /auth:
  // redirect to home (no need to show auth page again)
  if (isPublic && authenticated) {
    return next({ name: 'home' });
  }

  return next();
});

// Handle 401 responses from the API client.
// This fires when a token expires mid-session.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:required', () => {
    // Only redirect if not already on the auth page
    if (router.currentRoute.value.name !== 'auth') {
      router.push({
        name: 'auth',
        query: {
          redirect: router.currentRoute.value.fullPath,
        },
      });
    }
  });
}

/**
 * Update document title on route change.
 * Format: "Page Name - Pathfinder"
 */
router.afterEach((to) => {
  const title = to.meta?.title;
  document.title = title
    ? `${title} - Pathfinder`
    : 'Pathfinder';
});

export default router;
