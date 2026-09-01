<template>
  <AppLayout>
    <div class="profile-view">
      <div class="profile-view__header">
        <h1 class="profile-view__title">My Profile</h1>
        <p class="profile-view__subtitle text-secondary">
          Manage your account details. Only you can see
          this page.
        </p>
      </div>

      <BaseAlert
        v-if="globalError"
        type="error"
        :message="globalError"
        dismissible
      />
      <BaseAlert
        v-if="successMessage"
        type="success"
        :message="successMessage"
        dismissible
      />

      <!-- Loading state -->
      <div v-if="loading" class="profile-view__loading">
        <p class="text-secondary">Loading profile...</p>
      </div>

      <!-- Profile content -->
      <div v-else-if="profile" class="profile-view__content">
        <!-- Profile summary card -->
        <div class="profile-view__card">
          <div class="profile-view__card-header">
            <div class="profile-view__avatar">
              {{ avatarInitials }}
            </div>
            <div class="profile-view__identity">
              <h2 class="profile-view__name">
                {{ profile.name }}
              </h2>
              <p class="profile-view__email font-mono">
                {{ profile.email }}
              </p>
            </div>
          </div>

          <div class="profile-view__meta">
            <div class="profile-view__meta-item">
              <span class="profile-view__meta-label">
                Age
              </span>
              <span class="profile-view__meta-value
                font-mono">
                {{ profile.age }}
              </span>
            </div>
            <div class="profile-view__meta-item">
              <span class="profile-view__meta-label">
                Member since
              </span>
              <span class="profile-view__meta-value
                font-mono">
                {{ formattedDate }}
              </span>
            </div>
            <div class="profile-view__meta-item">
              <span class="profile-view__meta-label">
                User ID
              </span>
              <span class="profile-view__meta-value
                font-mono profile-view__meta-value--muted">
                {{ profile.id }}
              </span>
            </div>
          </div>
        </div>

        <!-- Edit form -->
        <div class="profile-view__edit-panel">
          <div class="profile-view__section-header">
            <h3 class="profile-view__section-title">
              Edit Profile
            </h3>
            <BaseButton
              v-if="!editMode"
              variant="secondary"
              size="sm"
              @click="startEdit"
            >
              Edit
            </BaseButton>
          </div>

          <div v-if="editMode" class="profile-view__form">
            <BaseAlert
              v-if="editError"
              type="error"
              :message="editError"
            />
            <UserForm
              :loading="updating"
              :error="editError"
              :initial-data="profile"
              :edit-mode="true"
              @submit="handleUpdateProfile"
              @cancel="cancelEdit"
            />
          </div>

          <div v-else class="profile-view__read-only">
            <p class="text-secondary" style="font-size: var(--text-sm)">
              Click Edit to update your name, email, or age.
            </p>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="profile-view__danger-zone">
          <h3 class="profile-view__danger-title">
            Danger Zone
          </h3>
          <p class="profile-view__danger-desc text-secondary">
            Deleting your account is permanent. Your maps,
            obstacles, waypoints, and routes will remain in
            the system but will no longer be associated with
            any account.
          </p>
          <BaseButton
            v-if="!confirmDelete"
            variant="danger"
            size="sm"
            @click="confirmDelete = true"
          >
            Delete Account
          </BaseButton>
          <div v-else class="profile-view__confirm-delete">
            <p class="profile-view__confirm-text">
              Are you sure? This cannot be undone.
            </p>
            <div class="profile-view__confirm-actions">
              <BaseButton
                variant="secondary"
                size="sm"
                @click="confirmDelete = false"
              >
                Cancel
              </BaseButton>
              <BaseButton
                variant="danger"
                size="sm"
                :loading="deleting"
                @click="handleDeleteAccount"
              >
                Yes, Delete My Account
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/AppLayout.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import UserForm from '@/components/UserForm.vue';
import { getProfile, updateProfile, deleteAccount }
  from '@/api/users.js';
import { logout } from '@/api/auth.js';

const router = useRouter();

// ─── State ────────────────────────────────────────────────────

const profile = ref(null);
const loading = ref(false);
const updating = ref(false);
const deleting = ref(false);
const editMode = ref(false);
const confirmDelete = ref(false);
const globalError = ref('');
const editError = ref('');
const successMessage = ref('');

// ─── Computed ─────────────────────────────────────────────────

/**
 * avatarInitials — extracts the first letter of each word
 * in the user's name (up to 2 letters) for the avatar.
 */
const avatarInitials = computed(() => {
  if (!profile.value?.name) return '?';
  return profile.value.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
});

/**
 * formattedDate — formats createdAt as a readable date.
 */
const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return '';
  return new Date(profile.value.createdAt)
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
});

// ─── Lifecycle ────────────────────────────────────────────────

const fetchProfile = async () => {
  loading.value = true;
  globalError.value = '';
  try {
    profile.value = await getProfile();
  } catch (err) {
    globalError.value = err.message ||
      'Failed to load profile.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProfile);

// ─── Edit handlers ────────────────────────────────────────────

const startEdit = () => {
  editMode.value = true;
  editError.value = '';
  successMessage.value = '';
};

const cancelEdit = () => {
  editMode.value = false;
  editError.value = '';
};

const handleUpdateProfile = async (payload) => {
  updating.value = true;
  editError.value = '';
  try {
    const updated = await updateProfile(payload);
    profile.value = updated;
    editMode.value = false;
    successMessage.value = 'Profile updated successfully.';
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    editError.value = err.message ||
      'Update failed. Please try again.';
  } finally {
    updating.value = false;
  }
};

// ─── Delete account ───────────────────────────────────────────

const handleDeleteAccount = async () => {
  deleting.value = true;
  try {
    await deleteAccount();
    logout(); // clear token
    router.push({ name: 'auth' });
  } catch (err) {
    globalError.value = err.message ||
      'Account deletion failed. Please try again.';
    confirmDelete.value = false;
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 680px;
}

.profile-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.profile-view__loading {
  padding: var(--space-8);
  text-align: center;
}

/* Profile card */
.profile-view__card {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.profile-view__card-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Avatar initials circle */
.profile-view__avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-muted);
  border: 2px solid var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--color-accent);
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.profile-view__identity {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.profile-view__name {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.profile-view__email {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta grid */
.profile-view__meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
}

.profile-view__meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-view__meta-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: var(--font-semibold);
}

.profile-view__meta-value {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.profile-view__meta-value--muted {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  word-break: break-all;
}

/* Edit panel */
.profile-view__edit-panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-view__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-view__section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

/* Danger zone */
.profile-view__danger-zone {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-view__danger-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-error);
}

.profile-view__danger-desc {
  font-size: var(--text-sm);
  line-height: 1.6;
}

.profile-view__confirm-delete {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-view__confirm-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-error);
}

.profile-view__confirm-actions {
  display: flex;
  gap: var(--space-3);
}
</style>
