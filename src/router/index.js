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
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'My Profile' },
  },
  {
    path: '/validation',
    name: 'validation',
    component: () => import('../views/ValidationView.vue'),
    meta: { title: 'Validation' },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/StatsView.vue'),
    meta: { title: 'API Statistics' },
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

router.beforeEach((to, _from, next) => {
  const isPublicRoute = to.meta?.public === true;
  const authenticated = tokenStore.isAuthenticated();

  // Case 1: going to a protected route without auth
  if (!isPublicRoute && !authenticated) {
    return next({
      name: 'auth',
      query: { redirect: to.fullPath },
    });
  }

  // Case 2: going to /auth while already authenticated
  // redirect to the intended route or home
  if (isPublicRoute && authenticated &&
      to.name === 'auth') {
    const redirect = to.query?.redirect;
    return next(redirect || { name: 'home' });
  }

  // Case 3: all other cases — proceed normally
  return next();
});

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
