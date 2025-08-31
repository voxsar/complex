<template>
  <div class="webhooks-list">
    <h1>Webhook Endpoints</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <div v-else>
      <table class="endpoints-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>URL</th>
            <th>Events</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="endpoint in endpoints" :key="endpoint.id">
            <td>{{ endpoint.id }}</td>
            <td>{{ endpoint.url }}</td>
            <td>{{ endpoint.events.join(', ') }}</td>
            <td>
              <button @click="startEdit(endpoint)">Edit</button>
              <button @click="deleteEndpoint(endpoint.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="endpoints.length === 0">
            <td colspan="4">No endpoints found</td>
          </tr>
        </tbody>
      </table>

      <h2>{{ editing ? 'Edit Endpoint' : 'Register Endpoint' }}</h2>
      <form @submit.prevent="saveEndpoint" class="endpoint-form">
        <div class="form-group">
          <label for="url">URL</label>
          <input id="url" v-model="form.url" type="url" required />
        </div>
        <div class="form-group">
          <label for="events">Events (comma separated)</label>
          <input id="events" v-model="form.events" type="text" required />
        </div>
        <div class="form-actions">
          <button type="submit">{{ editing ? 'Update' : 'Create' }}</button>
          <button v-if="editing" type="button" @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
}

const endpoints = ref<WebhookEndpoint[]>([])
const loading = ref(false)
const error = ref('')

const form = ref({ url: '', events: '' })
const editing = ref<WebhookEndpoint | null>(null)

const fetchEndpoints = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/webhooks/endpoints')
    if (!res.ok) throw new Error('Failed to fetch endpoints')
    const data = await res.json()
    endpoints.value = data.data ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching endpoints'
  } finally {
    loading.value = false
  }
}

const saveEndpoint = async () => {
  const payload = {
    url: form.value.url,
    events: form.value.events.split(',').map(e => e.trim()).filter(Boolean)
  }
  try {
    let res: Response
    if (editing.value) {
      res = await fetch(`/api/webhooks/endpoints/${editing.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      res = await fetch('/api/webhooks/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    if (!res.ok) throw new Error('Failed to save endpoint')
    await fetchEndpoints()
    cancelEdit()
  } catch (err) {
    console.error(err)
  }
}

const startEdit = (endpoint: WebhookEndpoint) => {
  editing.value = endpoint
  form.value.url = endpoint.url
  form.value.events = endpoint.events.join(', ')
}

const cancelEdit = () => {
  editing.value = null
  form.value = { url: '', events: '' }
}

const deleteEndpoint = async (id: string) => {
  if (!confirm('Delete this endpoint?')) return
  try {
    const res = await fetch(`/api/webhooks/endpoints/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete endpoint')
    await fetchEndpoints()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchEndpoints)
</script>

<style scoped>
.endpoints-table {
  width: 100%;
  border-collapse: collapse;
}

.endpoints-table th,
.endpoints-table td {
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

.endpoint-form {
  margin-top: 20px;
  max-width: 400px;
}

.form-group {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.form-actions {
  display: flex;
  gap: 10px;
}
</style>
