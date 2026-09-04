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
      <div v-if="isAuthenticated" class="app-sidebar__user-info">
        <span class="app-sidebar__user-email font-mono">
          {{ userEmail }}
        </span>
      </div>

      <!-- SIGN IN BUTTON — shown when UNAUTHENTICATED -->
      <BaseButton
        v-if="!isAuthenticated"
        variant="secondary"
        size="sm"
        class="sidebar__auth-btn"
        @click="triggerAuthModal"
      >
        Sign In
      </BaseButton>

      <!-- LOGOUT BUTTON — shown when AUTHENTICATED -->
      <button
        v-else
        class="sidebar__logout-btn"
        @click="handleLogout"
      >
        <span class="sidebar__logout-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </span>
        Sign Out
      </button>
    </div>
    <div class="app-sidebar__footer">
      <p class="app-sidebar__footer-text">
        v{{ appVersion }}
      </p>
      <p class="app-sidebar__footer-text">
        Backend: {{ backendUrl }}
      </p>
    </div>
  </aside>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { logout } from '@/api/auth.js';
import { tokenStore } from '@/auth/tokenStore.js';
import { computed } from 'vue';
import BaseButton from '@/components/BaseButton.vue';

const backendUrl = import.meta.env.VITE_API_BASE_URL;

const emit = defineEmits(['navigate']);

const router = useRouter();

const isAuthenticated = computed(() => tokenStore.isAuthenticated());

const triggerAuthModal = () => {
  window.dispatchEvent(
    new CustomEvent('auth:required', {
      detail: {
        message: 'Sign in to access all features.',
        intendedPath: router.currentRoute.value.fullPath,
      },
    })
  );
};

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
  {
    name: 'stats',
    label: 'Stats',
    path: '/stats',
    routeName: 'stats',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
  },
  {
    name: 'profile',
    label: 'Profile',
    path: '/profile',
    routeName: 'profile',
    icon: `<svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
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

.sidebar__auth-btn {
  width: 100%;
}

.sidebar__logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar__logout-btn:hover {
  background-color: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}

.sidebar__logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
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
  /* Layout specific to sidebar placement */
  display: flex;
  justify-content: center;
  align-items: center;
}
