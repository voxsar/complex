<template>
  <div class="sales-channels-list">
    <h1>Sales Channels</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="sales-channels-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="channel in channels" :key="channel.id">
          <td>{{ channel.name }}</td>
          <td>{{ channel.description || '-' }}</td>
          <td class="active-column">
            <input
              type="checkbox"
              :checked="channel.isActive"
              @change="toggleActive(channel)"
            />
          </td>
          <td>
            <RouterLink :to="`/settings/sales-channels/${channel.id}`">
              View
            </RouterLink>
          </td>
        </tr>
        <tr v-if="channels.length === 0">
          <td colspan="4">No sales channels found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface SalesChannel {
  id: string
  name: string
  description?: string
  isActive: boolean
}

const channels = ref<SalesChannel[]>([])
const loading = ref(false)
const error = ref('')

const fetchChannels = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/sales-channels')
    if (!res.ok) throw new Error('Failed to fetch sales channels')
    const data = await res.json()
    channels.value = data.salesChannels || []
  } catch (err: any) {
    error.value = err.message || 'Error fetching sales channels'
  } finally {
    loading.value = false
  }
}

const toggleActive = async (channel: SalesChannel) => {
  const newStatus = !channel.isActive
  try {
    const res = await fetch(`/api/sales-channels/${channel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newStatus })
    })
    if (!res.ok) throw new Error('Failed to update channel')
    channel.isActive = newStatus
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchChannels)
</script>

<style scoped>
.sales-channels-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-channels-table th,
.sales-channels-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.active-column {
  text-align: center;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}
</style>
