<template>
  <div class="exchanges-list">
    <h1>Order Exchanges</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="exchanges-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Order ID</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ex in exchanges" :key="ex.id">
          <td>{{ ex.id }}</td>
          <td>{{ ex.orderId }}</td>
          <td>{{ ex.status }}</td>
          <td>
            <button
              @click="approveExchange(ex.id)"
              :disabled="ex.status !== 'requested'"
            >
              Approve
            </button>
            <button
              @click="denyExchange(ex.id)"
              :disabled="ex.status !== 'requested'"
            >
              Deny
            </button>
          </td>
        </tr>
        <tr v-if="exchanges.length === 0">
          <td colspan="4">No exchanges found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Exchange {
  id: string
  orderId: string
  status: string
}

const exchanges = ref<Exchange[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  fetchExchanges()
})

async function fetchExchanges() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/order-exchanges')
    if (!res.ok) throw new Error('Failed to fetch exchanges')
    const data = await res.json()
    exchanges.value = data.exchanges ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching exchanges'
  } finally {
    loading.value = false
  }
}

async function approveExchange(id: string) {
  try {
    const res = await fetch(`/api/order-exchanges/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!res.ok) throw new Error('Failed to approve exchange')
    await res.json()
    fetchExchanges()
  } catch (err) {
    console.error(err)
  }
}

async function denyExchange(id: string) {
  try {
    const res = await fetch(`/api/order-exchanges/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    })
    if (!res.ok) throw new Error('Failed to deny exchange')
    await res.json()
    fetchExchanges()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.exchanges-table {
  width: 100%;
  border-collapse: collapse;
}

.exchanges-table th,
.exchanges-table td {
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

