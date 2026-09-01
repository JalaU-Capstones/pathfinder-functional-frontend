<template>
  <div class="auth-view">
    <div class="auth-view__card">
      <div class="auth-view__brand">
        <h1 class="auth-view__title">Pathfinder</h1>
        <p class="auth-view__subtitle">
          Functional Backend Interface
        </p>
      </div>

      <!-- Tab switcher -->
      <div class="auth-view__tabs" role="tablist">
        <button
          class="auth-view__tab"
          :class="{
            'auth-view__tab--active': activeTab === 'login'
          }"
          role="tab"
          :aria-selected="activeTab === 'login'"
          @click="switchTab('login')"
        >
          Sign In
        </button>
        <button
          class="auth-view__tab"
          :class="{
            'auth-view__tab--active': activeTab === 'register'
          }"
          role="tab"
          :aria-selected="activeTab === 'register'"
          @click="switchTab('register')"
        >
          Create Account
        </button>
      </div>

      <!-- Alerts -->
      <BaseAlert
        v-if="error"
        type="error"
        :message="error"
        dismissible
      />
      <BaseAlert
        v-if="successMessage"
        type="success"
        :message="successMessage"
      />

      <!-- Login form -->
      <form
        v-if="activeTab === 'login'"
        class="auth-view__form"
        @submit.prevent="handleLogin"
      >
        <BaseInput
          v-model="loginForm.email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          :error="loginErrors.email"
          required
          autocomplete="email"
        />
        <BaseInput
          v-model="loginForm.password"
          label="Password"
          type="password"
          placeholder="Your password"
          :error="loginErrors.password"
          required
          autocomplete="current-password"
        />
        <BaseButton
          type="submit"
          :loading="loading"
          class="auth-view__submit"
        >
          Sign In
        </BaseButton>
        <p class="auth-view__switch">
          No account yet?
          <button
            type="button"
            class="auth-view__switch-link"
            @click="switchTab('register')"
          >
            Create one
          </button>
        </p>
      </form>

      <!-- Register form -->
      <form
        v-if="activeTab === 'register'"
        class="auth-view__form"
        @submit.prevent="handleRegister"
      >
        <BaseInput
          v-model="registerForm.name"
          label="Full Name"
          placeholder="Diego Botina"
          :error="registerErrors.name"
          required
          autocomplete="name"
        />
        <BaseInput
          v-model="registerForm.email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          :error="registerErrors.email"
          required
          autocomplete="email"
        />
        <BaseInput
          v-model="registerForm.password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          :error="registerErrors.password"
          hint="Minimum 8 characters"
          required
          autocomplete="new-password"
        />
        <BaseInput
          v-model.number="registerForm.age"
          label="Age"
          type="number"
          placeholder="22"
          :error="registerErrors.age"
          required
        />
        <BaseButton
          type="submit"
          :loading="loading"
          class="auth-view__submit"
        >
          Create Account
        </BaseButton>
        <p class="auth-view__switch">
          Already have an account?
          <button
            type="button"
            class="auth-view__switch-link"
            @click="switchTab('login')"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import { login, register } from '@/api/auth.js';

const router = useRouter();
const route = useRoute();

// ─── Tab state ────────────────────────────────────────────────

const activeTab = ref('login');

const switchTab = (tab) => {
  activeTab.value = tab;
  error.value = '';
  successMessage.value = '';
  clearErrors();
};

// ─── Shared state ─────────────────────────────────────────────

const loading = ref(false);
const error = ref('');
const successMessage = ref('');

// ─── Login form ───────────────────────────────────────────────

const loginForm = reactive({ email: '', password: '' });
const loginErrors = reactive({ email: '', password: '' });

const validateLogin = () => {
  loginErrors.email = loginForm.email.trim()
    ? '' : 'Email is required.';
  loginErrors.password = loginForm.password
    ? '' : 'Password is required.';
  return !loginErrors.email && !loginErrors.password;
};

const handleLogin = async () => {
  if (!validateLogin()) return;
  loading.value = true;
  error.value = '';
  try {
    await login({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });
    // Redirect to the page the user tried to access,
    // or to home if they came directly to /auth
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } catch (err) {
    error.value = err.message ||
      'Sign in failed. Check your credentials.';
  } finally {
    loading.value = false;
  }
};

// ─── Register form ────────────────────────────────────────────

const registerForm = reactive({
  name: '', email: '', password: '', age: '',
});
const registerErrors = reactive({
  name: '', email: '', password: '', age: '',
});

const validateRegister = () => {
  registerErrors.name = registerForm.name.trim()
    ? '' : 'Name is required.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  registerErrors.email = emailPattern.test(registerForm.email)
    ? '' : 'A valid email is required.';
  registerErrors.password = registerForm.password.length >= 8
    ? '' : 'Password must be at least 8 characters.';
  registerErrors.age =
    Number.isInteger(Number(registerForm.age)) &&
    Number(registerForm.age) > 0
      ? '' : 'Age must be a positive integer.';
  return !registerErrors.name && !registerErrors.email &&
         !registerErrors.password && !registerErrors.age;
};

const handleRegister = async () => {
  if (!validateRegister()) return;
  loading.value = true;
  error.value = '';
  try {
    await register({
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      age: Number(registerForm.age),
    });
    // Registration auto-logs in (token stored by api/auth.js)
    // Redirect to home
    router.push('/');
  } catch (err) {
    error.value = err.message ||
      'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};

// ─── Shared helpers ───────────────────────────────────────────

const clearErrors = () => {
  Object.keys(loginErrors).forEach(
    (k) => { loginErrors[k] = ''; }
  );
  Object.keys(registerErrors).forEach(
    (k) => { registerErrors[k] = ''; }
  );
};
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-base);
  padding: var(--space-4);
}

.auth-view__card {
  width: 100%;
  max-width: 420px;
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-view__brand {
  text-align: center;
}

.auth-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-accent);
  letter-spacing: -0.02em;
}

.auth-view__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

/* Tabs */
.auth-view__tabs {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.auth-view__tab {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.auth-view__tab:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface-2);
}

.auth-view__tab--active {
  background-color: var(--color-accent);
  color: var(--color-bg-base);
}

/* Forms */
.auth-view__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-view__submit {
  width: 100%;
  margin-top: var(--space-2);
}

/* Switch link */
.auth-view__switch {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.auth-view__switch-link {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  padding: 0;
  transition: color var(--transition-fast);
}

.auth-view__switch-link:hover {
  color: var(--color-accent-light);
}

/* Responsive */
@media (max-width: 480px) {
  .auth-view__card {
    padding: var(--space-6);
    border-radius: var(--radius-lg);
  }
}
</style>
