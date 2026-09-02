import { createRouter, createWebHistory } from 'vue-router';
import { tokenStore } from '@/auth/tokenStore.js';

/**
 * Application routes.
 * Each route corresponds to a main section of the UI.
 * Views are lazy-loaded to keep the initial bundle small.
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home', public: true },
  },
  {
    path: '/validation',
    name: 'validation',
    component: () => import('@/views/ValidationView.vue'),
    meta: { title: 'Validation', public: true },
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { title: 'Sign In / Register', public: true },
  },
  {
    path: '/maps',
    name: 'maps',
    component: () => import('@/views/MapsView.vue'),
    meta: { title: 'Maps' },
  },
  {
    path: '/obstacles',
    name: 'obstacles',
    component: () => import('@/views/ObstaclesView.vue'),
    meta: { title: 'Obstacles' },
  },
  {
    path: '/waypoints',
    name: 'waypoints',
    component: () => import('@/views/WaypointsView.vue'),
    meta: { title: 'Waypoints' },
  },
  {
    path: '/routes',
    name: 'routes',
    component: () => import('@/views/RoutesView.vue'),
    meta: { title: 'Routes' },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { title: 'API Statistics' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: 'Profile' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found', public: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const isPublic = to.meta?.public === true;
  const isAuthenticated = tokenStore.isAuthenticated();

  // ─── Case 1: Public route → allow freely ───
  if (isPublic) {
    return next();
  }

  // ─── Case 2: Authenticated → allow ───
  if (isAuthenticated) {
    return next();
  }

  // ─── Case 3: Protected route + NOT logged in ───
  // DO NOT REDIRECT! Stay on this page...
  // Fire event → AuthModal appears as floating overlay
  window.dispatchEvent(
    new CustomEvent('auth:required', {
      detail: {
        message: `Sign in to access ${to.meta?.title || 'this page'}.`,
        intendedPath: to.fullPath,
      },
    })
  );

  // Allow navigation to proceed — page loads (empty/protected content)
  // User sees page background dimmed + AuthModal floating
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
