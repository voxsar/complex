<template>
  <div class="shipments-list">
    <h1>Shipments</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="shipments-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Status</th>
          <th>Tracking #</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="shipment in shipments" :key="shipment.id">
          <td>{{ shipment.orderId }}</td>
          <td>
            <select
              v-model="shipment.status"
              @change="updateStatus(shipment.id, shipment.status)"
            >
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </td>
          <td>
            <a
              v-if="shipment.trackingNumber"
              :href="`/api/shipments/${shipment.id}/track`"
              target="_blank"
              rel="noopener"
              >{{ shipment.trackingNumber }}</a
            >
            <span v-else>—</span>
          </td>
          <td>{{ new Date(shipment.createdAt).toLocaleString() }}</td>
        </tr>
        <tr v-if="shipments.length === 0">
          <td colspan="4">No shipments found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Shipment {
  id: string
  orderId: string
  status: string
  trackingNumber?: string
  createdAt: string
}

const shipments = ref<Shipment[]>([])
const loading = ref(false)
const error = ref('')

const statusOptions = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
  'CANCELLED'
]

const fetchShipments = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/shipments')
    if (!res.ok) throw new Error('Failed to fetch shipments')
    const data = await res.json()
    shipments.value = data.shipments ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching shipments'
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id: string, status: string) => {
  try {
    const res = await fetch(`/api/shipments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update shipment status')
  } catch (err) {
    console.error(err)
    fetchShipments()
  }
}

onMounted(() => {
  fetchShipments()
})
</script>

<style scoped>
.shipments-table {
  width: 100%;
  border-collapse: collapse;
}

.shipments-table th,
.shipments-table td {
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
