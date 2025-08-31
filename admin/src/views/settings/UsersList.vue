<template>
  <div class="users-list">
    <h1>Users</h1>

    <form @submit.prevent="createUser" class="create-user-form">
      <h2>Create User</h2>
      <input v-model="newUser.firstName" placeholder="First name" required />
      <input v-model="newUser.lastName" placeholder="Last name" required />
      <input v-model="newUser.email" type="email" placeholder="Email" required />
      <input v-model="newUser.password" type="password" placeholder="Password" required />
      <select v-model="newUser.role">
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="staff">Staff</option>
      </select>
      <button type="submit">Create</button>
    </form>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <select v-model="user.role" @change="updateRole(user)">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </td>
          <td>{{ user.isActive ? 'Active' : 'Inactive' }}</td>
          <td>
            <button @click="toggleStatus(user)">
              {{ user.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="5">No users found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
}

const users = ref<AdminUser[]>([])
const loading = ref(false)
const error = ref('')

const newUser = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'admin'
})

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/users?role=admin')
    if (!res.ok) throw new Error('Failed to fetch users')
    const data = await res.json()
    users.value = data.users ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching users'
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser.value)
    })
    if (!res.ok) throw new Error('Failed to create user')
    const data = await res.json()
    users.value.push(data.user)
    newUser.value = { firstName: '', lastName: '', email: '', password: '', role: 'admin' }
  } catch (err: any) {
    alert(err.message || 'Error creating user')
  }
}

const updateRole = async (user: AdminUser) => {
  try {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: user.role })
    })
    if (!res.ok) throw new Error('Failed to update role')
  } catch (err: any) {
    alert(err.message || 'Error updating role')
  }
}

const toggleStatus = async (user: AdminUser) => {
  try {
    const res = await fetch(`/api/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive })
    })
    if (!res.ok) throw new Error('Failed to update status')
    user.isActive = !user.isActive
  } catch (err: any) {
    alert(err.message || 'Error updating status')
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.create-user-form {
  margin-bottom: 20px;
}

.create-user-form input,
.create-user-form select {
  margin-right: 8px;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}
</style>

