import { createRouter, createWebHistory } from 'vue-router';

/**
 * Application routes.
 * Each route corresponds to a main section of the UI.
 * Views are lazy-loaded to keep the initial bundle small.
 */
const routes = [
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
