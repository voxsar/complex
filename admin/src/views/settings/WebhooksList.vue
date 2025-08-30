<template>
  <div class="webhooks-list">
    <h1>Webhook Events</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="events-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Source</th>
          <th>Type</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in events" :key="event.id">
          <td>{{ event.id }}</td>
          <td>{{ event.source }}</td>
          <td>{{ event.type }}</td>
          <td>{{ event.status }}</td>
          <td>{{ new Date(event.createdAt).toLocaleString() }}</td>
          <td>
            <button v-if="event.status === 'failed'" @click="retryEvent(event.id)">Retry</button>
          </td>
        </tr>
        <tr v-if="events.length === 0">
          <td colspan="6">No events found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WebhookEvent {
  id: string
  source: string
  type: string
  status: string
  createdAt: string
}

const events = ref<WebhookEvent[]>([])
const loading = ref(false)
const error = ref('')

const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/webhooks/events')
    if (!res.ok) throw new Error('Failed to fetch webhook events')
    const data = await res.json()
    events.value = data.data ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching webhook events'
  } finally {
    loading.value = false
  }
}

const retryEvent = async (id: string) => {
  if (!confirm('Retry this webhook event?')) return
  try {
    const res = await fetch(`/api/webhooks/events/${id}/retry`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to retry webhook event')
    await fetchEvents()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchEvents)
</script>

<style scoped>
.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th,
.events-table td {
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
</style>
