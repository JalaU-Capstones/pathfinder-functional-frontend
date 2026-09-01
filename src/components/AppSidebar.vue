<template>
  <aside class="app-sidebar">
    <nav class="app-sidebar__nav" role="navigation"
         aria-label="Main navigation">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="app-sidebar__nav-item"
        :class="{ 'app-sidebar__nav-item--active':
          $route.name === item.routeName }"
        :aria-current="$route.name === item.routeName
          ? 'page' : undefined"
        @click="$emit('navigate')"
      >
        <span class="app-sidebar__nav-icon"
              aria-hidden="true"
              v-html="item.icon">
        </span>
        <span class="app-sidebar__nav-label">
          {{ item.label }}
        </span>
      </RouterLink>
    </nav>


    <div class="app-sidebar__user">
      <div class="app-sidebar__user-info">
        <span class="app-sidebar__user-email font-mono">
          {{ userEmail }}
        </span>
      </div>
      <button
        class="app-sidebar__logout"
        type="button"
        @click="handleLogout"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
    <div class="app-sidebar__footer">
      <p class="app-sidebar__footer-text">
        v{{ appVersion }}
      </p>
      <p class="app-sidebar__footer-text">
        Backend: localhost:3000
      </p>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { logout } from '@/api/auth.js';
import { tokenStore } from '@/auth/tokenStore.js';
import { computed } from 'vue';

const emit = defineEmits(['navigate']);

const router = useRouter();

const handleLogout = () => {
  logout(); // clears localStorage token
  router.push({ name: 'auth' });
};

const userEmail = computed(() => {
  const payload = tokenStore.getTokenPayload();
  return payload?.email || '';
});


// Read version from package.json via Vite env
// Vite exposes this via define in vite.config.js
// For now use a fallback — Phase 15A can be updated
// to add the define if needed, or read from a constant
const appVersion = '1.0.0';

/**
 * Navigation items. Each entry maps to a route and
 * includes an inline SVG icon (no external library).
 * SVG paths are minimal — 24x24 viewBox.
 */
const navItems = [
  {
    name: 'maps',
    label: 'Maps',
    path: '/maps',
    routeName: 'maps',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <polygon points="3,6 9,3 15,6 21,3 21,18
        15,21 9,18 3,21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>`,
  },
  {
    name: 'obstacles',
    label: 'Obstacles',
    path: '/obstacles',
    routeName: 'obstacles',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18"
        rx="2" ry="2"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
    </svg>`,
  },
  {
    name: 'waypoints',
    label: 'Waypoints',
    path: '/waypoints',
    routeName: 'waypoints',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
    </svg>`,
  },
  {
    name: 'routes',
    label: 'Routes',
    path: '/routes',
    routeName: 'routes',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>`,
  },
  {
    name: 'users',
    label: 'Users',
    path: '/users',
    routeName: 'users',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M20,21v-2a4,4 0 0,0-4-4H8a4,4
        0 0,0-4,4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
  },
  {
    name: 'validation',
    label: 'Validation',
    path: '/validation',
    routeName: 'validation',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <polyline points="9,11 12,14 22,4"/>
      <path d="M21,12v7a2,2 0 0,1-2,2H5a2,2
        0 0,1-2-2V5a2,2 0 0,1,2-2h11"/>
    </svg>`,
  },
];
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: var(--color-bg-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 90;
  overflow-y: auto;
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-4) 0;
  gap: var(--space-1);
}

.app-sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.app-sidebar__nav-item:hover {
  background-color: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}

.app-sidebar__nav-item--active {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.app-sidebar__nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: inherit;
}

.app-sidebar__nav-label {
  flex-grow: 1;
}

.app-sidebar__footer {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.app-sidebar__footer-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  line-height: 1.6;
}

/* Mobile: sidebar is off-screen by default */
@media (max-width: 900px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    z-index: 95;
    box-shadow: var(--shadow-lg);
  }
}

.app-sidebar--open {
  transform: translateX(0) !important;
}
</style>

.app-sidebar__user {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.app-sidebar__user-info {
  display: flex;
  overflow: hidden;
}

.app-sidebar__user-email {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  flex: 1;
}

.app-sidebar__logout {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  text-align: center;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.app-sidebar__logout:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-accent-muted);
}
