<template>
  <AppLayout>
    <div class="users-view">
      <div class="users-view__header">
        <h1 class="users-view__title">Users</h1>
        <BaseButton
          v-if="!showCreateForm && !editingUser"
          @click="showCreateForm = true"
        >
          New User
        </BaseButton>
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

      <!-- Create form -->
      <div v-if="showCreateForm"
           class="users-view__form-panel">
        <UserForm
          :loading="creating"
          :error="createError"
          @submit="handleCreateUser"
          @cancel="showCreateForm = false"
        />
      </div>

      <!-- Edit form -->
      <div v-if="editingUser"
           class="users-view__form-panel users-view__form-panel--edit">
        <UserForm
          :loading="updating"
          :error="updateError"
          :initial-data="editingUser"
          :edit-mode="true"
          @submit="handleUpdateUser"
          @cancel="editingUser = null"
        />
      </div>

      <!-- Users table -->
      <div class="users-view__table-panel">
        <div class="users-view__table-header">
          <h2 class="users-view__section-title">
            All Users
          </h2>
          <span class="users-view__count text-muted">
            {{ users.length }} total
          </span>
        </div>

        <div v-if="loading"
             class="users-view__loading">
          <p class="text-secondary">Loading users...</p>
        </div>

        <div v-else-if="users.length === 0"
             class="users-view__empty">
          <p class="text-secondary">
            No users found. Create the first user.
          </p>
        </div>

        <table v-else class="users-view__table">
          <thead>
            <tr>
              <th class="users-view__th">Name</th>
              <th class="users-view__th">Email</th>
              <th class="users-view__th">Age</th>
              <th class="users-view__th">ID</th>
              <th class="users-view__th
                users-view__th--actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="users-view__tr"
            >
              <td class="users-view__td
                users-view__td--name">
                {{ user.name }}
              </td>
              <td class="users-view__td">
                {{ user.email }}
              </td>
              <td class="users-view__td
                users-view__td--mono">
                {{ user.age }}
              </td>
              <td class="users-view__td
                users-view__td--mono
                users-view__td--id">
                {{ user.id }}
              </td>
              <td class="users-view__td
                users-view__td--actions">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  @click="startEdit(user)"
                >
                  Edit
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="sm"
                  @click="handleDeleteUser(user)"
                >
                  Delete
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/AppLayout.vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseAlert from '@/components/BaseAlert.vue';
import UserForm from '@/components/UserForm.vue';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from '@/api';

const users = ref([]);
const loading = ref(false);
const creating = ref(false);
const updating = ref(false);
const showCreateForm = ref(false);
const editingUser = ref(null);
const globalError = ref('');
const createError = ref('');
const updateError = ref('');
const successMessage = ref('');

const fetchUsers = async () => {
  loading.value = true;
  try {
    users.value = await getAllUsers();
  } catch (err) {
    globalError.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleCreateUser = async (payload) => {
  creating.value = true;
  createError.value = '';
  try {
    const created = await createUser(payload);
    users.value = [created, ...users.value];
    showCreateForm.value = false;
    successMessage.value =
      `User "${created.name}" created successfully.`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    createError.value = err.message;
  } finally {
    creating.value = false;
  }
};

const startEdit = (user) => {
  editingUser.value = { ...user };
  showCreateForm.value = false;
};

const handleUpdateUser = async (payload) => {
  updating.value = true;
  updateError.value = '';
  try {
    const updated = await updateUser(
      editingUser.value.id, payload
    );
    users.value = users.value.map((u) =>
      u.id === updated.id ? updated : u
    );
    editingUser.value = null;
    successMessage.value =
      `User "${updated.name}" updated successfully.`;
    setTimeout(() => { successMessage.value = ''; }, 4000);
  } catch (err) {
    updateError.value = err.message;
  } finally {
    updating.value = false;
  }
};

const handleDeleteUser = async (user) => {
  if (!confirm(
    `Delete user "${user.name}" (${user.email})?`
  )) return;

  globalError.value = '';
  try {
    await deleteUser(user.id);
    users.value =
      users.value.filter((u) => u.id !== user.id);
    if (editingUser.value?.id === user.id) {
      editingUser.value = null;
    }
    successMessage.value =
      `User "${user.name}" deleted.`;
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (err) {
    globalError.value = err.message;
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max-width);
}

.users-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.users-view__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.users-view__form-panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 480px;
}

.users-view__form-panel--edit {
  border-color: var(--color-accent);
}

.users-view__table-panel {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  overflow: hidden;
}

.users-view__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.users-view__section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.users-view__count {
  font-size: var(--text-sm);
}

.users-view__loading,
.users-view__empty {
  padding: var(--space-8);
  text-align: center;
}

.users-view__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.users-view__th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.users-view__th--actions {
  text-align: right;
}

.users-view__tr {
  transition: background-color var(--transition-fast);
}

.users-view__tr:hover {
  background-color: var(--color-bg-surface-2);
}

.users-view__td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.users-view__td--name {
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}

.users-view__td--mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.users-view__td--id {
  color: var(--color-text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.users-view__td--actions {
  text-align: right;
  white-space: nowrap;
}

.users-view__td--actions > * + * {
  margin-left: var(--space-2);
}
</style>
