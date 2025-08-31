<template>
  <div class="campaigns-list">
    <h1>Campaigns</h1>

    <div class="filters">
      <input
        v-model="search"
        type="text"
        placeholder="Search campaigns"
      />
      <select v-model="statusFilter">
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="running">Running</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <table v-else class="campaigns-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
          <th>Created</th>
          <th>Active</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="campaign in filteredCampaigns" :key="campaign.id">
          <td>{{ campaign.name }}</td>
          <td>{{ campaign.type }}</td>
          <td>{{ campaign.status }}</td>
          <td>{{ new Date(campaign.createdAt).toLocaleString() }}</td>
          <td>
            <label>
              <input
                type="checkbox"
                :checked="campaign.status === 'running'"
                @change="toggleActivation(campaign)"
              />
            </label>
          </td>
        </tr>
        <tr v-if="filteredCampaigns.length === 0">
          <td colspan="5">No campaigns found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  createdAt: string
}

const campaigns = ref<Campaign[]>([])
const loading = ref(false)
const error = ref('')
const statusFilter = ref('')
const search = ref('')

const fetchCampaigns = async () => {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (statusFilter.value) {
      params.append('status', statusFilter.value)
    }
    const res = await fetch(`/api/campaigns?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch campaigns')
    const data = await res.json()
    campaigns.value = data.campaigns ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching campaigns'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCampaigns)

watch(statusFilter, fetchCampaigns)

const filteredCampaigns = computed(() => {
  const term = search.value.toLowerCase()
  return campaigns.value.filter((c) =>
    c.name.toLowerCase().includes(term)
  )
})

const toggleActivation = async (campaign: Campaign) => {
  const isActive = campaign.status === 'running'
  try {
    const endpoint = `/api/campaigns/${campaign.id}/${isActive ? 'pause' : 'start'}`
    const res = await fetch(endpoint, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to update campaign status')
    const updated = await res.json()
    campaign.status = updated.status
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.campaigns-table {
  width: 100%;
  border-collapse: collapse;
}

.campaigns-table th,
.campaigns-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.filters {
  margin: 10px 0;
}

.filters input {
  margin-right: 10px;
  padding: 4px;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}
</style>
