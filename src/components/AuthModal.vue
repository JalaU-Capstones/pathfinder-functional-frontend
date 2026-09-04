<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="auth-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Authentication required"
      @click.self="close"
    >
      <div class="auth-modal__card">
        <div class="auth-modal__header">
          <h2 class="auth-modal__title">
            Session Expired
          </h2>
          <button
            class="auth-modal__close"
            aria-label="Close"
            @click="close"
          >
            x
          </button>
        </div>

        <p class="auth-modal__message">
          {{ message }}
        </p>

        <BaseAlert
          v-if="error"
          type="error"
          :message="error"
        />

        <!-- Login form -->
        <form
          class="auth-modal__form"
          @submit.prevent="handleLogin"
        >
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            :error="emailError"
            required
            autocomplete="email"
          />
          <BaseInput
            v-model="password"
            label="Password"
            type="password"
            placeholder="Your password"
            required
            autocomplete="current-password"
          />
          <BaseButton
            type="submit"
            :loading="loading"
            class="auth-modal__submit"
          >
            Sign In
          </BaseButton>
        </form>

        <p class="auth-modal__register-hint">
          No account?
          <button
            type="button"
            class="auth-modal__link"
            @click="goToAuth"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseInput from './BaseInput.vue';
import BaseButton from './BaseButton.vue';
import BaseAlert from './BaseAlert.vue';
import { login } from '@/api/auth.js';

const router = useRouter();

const visible = ref(false);
const message = ref(
  'Your session has expired. Sign in to continue.'
);
const email = ref('');
const password = ref('');
const emailError = ref('');
const error = ref('');
const loading = ref(false);
const intendedPath = ref('/');

const open = (detail) => {
  message.value = detail?.message ||
    'Sign in to access this feature.';
  // Save where user was going
  intendedPath.value = detail?.intendedPath || '/';
  visible.value = true;
  error.value = '';
  emailError.value = '';
};

const close = () => {
  visible.value = false;
  email.value = '';
  password.value = '';
  error.value = '';
  emailError.value = '';
};

const handleLogin = async () => {
  if (!email.value.trim()) {
    emailError.value = 'Email is required.';
    return;
  }
  emailError.value = '';
  loading.value = true;
  error.value = '';
  try {
    await login({
      email: email.value.trim(),
      password: password.value,
    });
    close();
    // Navigate to intended page after login
    await router.push(intendedPath.value);
  } catch (err) {
    error.value = err.message ||
      'Sign in failed. Check your credentials.';
  } finally {
    loading.value = false;
  }
};

const goToAuth = () => {
  close();
  router.push({
    name: 'auth',
    query: {
      redirect: intendedPath.value,
    },
  });
};

// Listen for the auth:required browser event
const handleAuthRequired = (event) => {
  open(event.detail);
};

onMounted(() => {
  window.addEventListener('auth:required', handleAuthRequired);
});

onUnmounted(() => {
  window.removeEventListener(
    'auth:required', handleAuthRequired
  );
});
</script>

<style scoped>
.auth-modal__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-4);
}

.auth-modal__card {
  width: 100%;
  max-width: 400px;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-modal__title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.auth-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  line-height: 1;
  padding: 0;
  transition: color var(--transition-fast);
}

.auth-modal__close:hover {
  color: var(--color-text-primary);
}

.auth-modal__message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.auth-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-modal__submit {
  width: 100%;
  margin-top: var(--space-1);
}

.auth-modal__register-hint {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.auth-modal__link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  padding: 0;
  transition: color var(--transition-fast);
}

.auth-modal__link:hover {
  color: var(--color-accent-light);
}
</style>
