<template>
  <div class="roles-list">
    <h1>Roles</h1>

    <div class="actions">
      <button @click="openCreate">New Role</button>
    </div>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="roles-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Permissions</th>
          <th>Priority</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in roles" :key="r.id">
          <td>{{ r.name }}</td>
          <td>{{ r.description }}</td>
          <td>{{ r.permissions.join(', ') }}</td>
          <td>{{ r.priority }}</td>
          <td>{{ r.isActive ? 'Yes' : 'No' }}</td>
          <td>
            <button @click="startEdit(r)">Edit</button>
          </td>
        </tr>
        <tr v-if="roles.length === 0">
          <td colspan="6">No roles found</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="role-form">
      <h2>{{ editingRole ? 'Edit Role' : 'Create Role' }}</h2>
      <form @submit.prevent="submitForm">
        <label>
          Name
          <input v-model="form.name" required />
        </label>
        <label>
          Description
          <input v-model="form.description" />
        </label>
        <label>
          Permissions (comma separated)
          <input v-model="permissionsInput" placeholder="permission:a, permission:b" />
        </label>
        <label>
          Priority
          <input type="number" v-model.number="form.priority" />
        </label>
        <label>
          Active
          <input type="checkbox" v-model="form.isActive" />
        </label>
        <div class="form-actions">
          <button type="submit">{{ editingRole ? 'Update' : 'Create' }}</button>
          <button type="button" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface Role {
  id: string
  name: string
  description?: string
  permissions: string[]
  isActive: boolean
  priority: number
  userCount?: number
}

const roles = ref<Role[]>([])
const loading = ref(false)
const error = ref('')

const showForm = ref(false)
const editingRole = ref<Role | null>(null)

const form = reactive({
  name: '',
  description: '',
  isActive: true,
  priority: 1
})
const permissionsInput = ref('')

const fetchRoles = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/admin/roles')
    if (!res.ok) throw new Error('Failed to fetch roles')
    const data = await res.json()
    roles.value = data.roles || []
  } catch (err: any) {
    error.value = err.message || 'Error fetching roles'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRoles)

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.isActive = true
  form.priority = 1
  permissionsInput.value = ''
}

const openCreate = () => {
  editingRole.value = null
  resetForm()
  showForm.value = true
}

const startEdit = (role: Role) => {
  editingRole.value = role
  form.name = role.name
  form.description = role.description || ''
  form.isActive = role.isActive
  form.priority = role.priority
  permissionsInput.value = role.permissions.join(', ')
  showForm.value = true
}

const submitForm = async () => {
  const payload = {
    name: form.name,
    description: form.description,
    permissions: permissionsInput.value
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0),
    isActive: form.isActive,
    priority: form.priority
  }

  try {
    const url = editingRole.value ? `/api/admin/roles/${editingRole.value.id}` : '/api/admin/roles'
    const method = editingRole.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Request failed')
    }
    await fetchRoles()
    showForm.value = false
  } catch (err) {
    console.error(err)
  }
}

const cancelEdit = () => {
  showForm.value = false
}
</script>

<style scoped>
.roles-table {
  width: 100%;
  border-collapse: collapse;
}

.roles-table th,
.roles-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}

.actions {
  margin-bottom: 1rem;
}

.role-form {
  margin-top: 1rem;
  max-width: 400px;
  border: 1px solid #ddd;
  padding: 1rem;
}

.role-form label {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
</style>
