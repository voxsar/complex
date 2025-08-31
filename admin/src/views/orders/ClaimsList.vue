<template>
  <div class="claims-list">
    <h1>Order Claims</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="claims-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Order ID</th>
          <th>Type</th>
          <th>Status</th>
          <th>Resolution</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="claim in claims" :key="claim.id">
          <td>{{ claim.claimNumber || claim.id }}</td>
          <td>{{ claim.orderId }}</td>
          <td>{{ claim.type }}</td>
          <td>{{ claim.status }}</td>
          <td class="resolution-cell">
            <input v-model="resolutionNotes[claim.id]" placeholder="Note" />
            <input v-model.number="refundAmounts[claim.id]" type="number" placeholder="Refund" />
          </td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button @click="approveClaim(claim.id)">Approve</button>
              <button @click="rejectClaim(claim.id)">Reject</button>
            </div>
            <div class="status-update">
              <select v-model="statusUpdates[claim.id]">
                <option disabled value="">Select</option>
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
              <button @click="updateStatus(claim.id)">Update</button>
            </div>
          </td>
        </tr>
        <tr v-if="claims.length === 0">
          <td colspan="6">No claims found</td>
        </tr>
      </tbody>
    </table>

    <h2>Create Claim</h2>
    <div class="create-form">
      <input v-model="newClaim.orderId" placeholder="Order ID" />
      <input v-model="newClaim.customerId" placeholder="Customer ID" />
      <input v-model="newClaim.type" placeholder="Type" />
      <textarea v-model="newClaim.items" placeholder='Items JSON'></textarea>
      <input v-model="newClaim.customerNote" placeholder="Customer note" />
      <button @click="createClaim">Create</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Claim {
  id: string
  claimNumber: string
  orderId: string
  customerId: string
  type: string
  status: string
}

const claims = ref<Claim[]>([])
const loading = ref(false)
const error = ref('')

const statusOptions = ['requested','in_review','approved','rejected','resolved','cancelled']
const statusUpdates = ref<Record<string, string>>({})
const resolutionNotes = ref<Record<string, string>>({})
const refundAmounts = ref<Record<string, number>>({})

const newClaim = ref({ orderId:'', customerId:'', type:'refund', items:'[]', customerNote:'' })

onMounted(() => {
  fetchClaims()
})

async function fetchClaims() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/order-claims')
    if (!res.ok) throw new Error('Failed to fetch claims')
    const data = await res.json()
    claims.value = data.claims ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching claims'
  } finally {
    loading.value = false
  }
}

async function createClaim() {
  try {
    const body = {
      orderId: newClaim.value.orderId,
      customerId: newClaim.value.customerId,
      type: newClaim.value.type,
      customerNote: newClaim.value.customerNote,
      items: JSON.parse(newClaim.value.items || '[]')
    }
    const res = await fetch('/api/order-claims', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to create claim')
    await res.json()
    newClaim.value = { orderId:'', customerId:'', type:'refund', items:'[]', customerNote:'' }
    fetchClaims()
  } catch (err) {
    console.error(err)
  }
}

async function updateStatus(id: string) {
  const status = statusUpdates.value[id]
  if (!status) return
  try {
    const res = await fetch(`/api/order-claims/${id}/status`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update status')
    await res.json()
    fetchClaims()
  } catch (err) {
    console.error(err)
  }
}

async function approveClaim(id: string) {
  try {
    const body = {
      refundAmount: refundAmounts.value[id] || 0,
      resolutionNote: resolutionNotes.value[id] || ''
    }
    const res = await fetch(`/api/order-claims/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to approve claim')
    await res.json()
    delete resolutionNotes.value[id]
    delete refundAmounts.value[id]
    fetchClaims()
  } catch (err) {
    console.error(err)
  }
}

async function rejectClaim(id: string) {
  try {
    const body = { resolutionNote: resolutionNotes.value[id] || '' }
    const res = await fetch(`/api/order-claims/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to reject claim')
    await res.json()
    delete resolutionNotes.value[id]
    delete refundAmounts.value[id]
    fetchClaims()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.claims-table {
  width: 100%;
  border-collapse: collapse;
}

.claims-table th,
.claims-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.resolution-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.actions-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.status-update {
  display: flex;
  gap: 0.25rem;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}

.create-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.create-form input,
.create-form textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
}
</style>
