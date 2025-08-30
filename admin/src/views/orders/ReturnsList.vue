<template>
  <div class="returns-list">
    <h1>Order Returns</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="returns-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Order ID</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ret in returns" :key="ret.id">
          <td>{{ ret.id }}</td>
          <td>{{ ret.orderId }}</td>
          <td>{{ ret.status }}</td>
          <td>
            <select v-model="statusUpdates[ret.id]">
              <option disabled value="">Select</option>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
            <button @click="updateStatus(ret.id)">Update</button>
          </td>
        </tr>
        <tr v-if="returns.length === 0">
          <td colspan="4">No returns found</td>
        </tr>
      </tbody>
    </table>

    <h2>Create Return</h2>
    <div class="create-form">
      <input v-model="newReturn.orderId" placeholder="Order ID" />
      <input v-model="newReturn.customerId" placeholder="Customer ID" />
      <input v-model="newReturn.reason" placeholder="Reason" />
      <textarea v-model="newReturn.items" placeholder='Items JSON'></textarea>
      <input v-model="newReturn.customerNote" placeholder="Customer note" />
      <input v-model.number="newReturn.refundAmount" type="number" placeholder="Refund amount" />
      <input v-model="newReturn.currency" placeholder="Currency" />
      <button @click="createReturn">Create</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface OrderReturn {
  id: string
  orderId: string
  customerId: string
  status: string
}

const returns = ref<OrderReturn[]>([])
const loading = ref(false)
const error = ref('')

const statusOptions = ['requested','approved','rejected','in_transit','received','processed','refunded','cancelled']
const statusUpdates = ref<Record<string, string>>({})

const newReturn = ref({ orderId:'', customerId:'', reason:'', items:'[]', customerNote:'', refundAmount:0, currency:'' })

onMounted(() => {
  fetchReturns()
})

async function fetchReturns() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/order-returns')
    if (!res.ok) throw new Error('Failed to fetch returns')
    const data = await res.json()
    returns.value = data.returns ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching returns'
  } finally {
    loading.value = false
  }
}

async function createReturn() {
  try {
    const body = {
      orderId: newReturn.value.orderId,
      customerId: newReturn.value.customerId,
      reason: newReturn.value.reason,
      customerNote: newReturn.value.customerNote,
      refundAmount: newReturn.value.refundAmount,
      currency: newReturn.value.currency,
      items: JSON.parse(newReturn.value.items || '[]')
    }
    const res = await fetch('/api/order-returns', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to create return')
    await res.json()
    newReturn.value = { orderId:'', customerId:'', reason:'', items:'[]', customerNote:'', refundAmount:0, currency:'' }
    fetchReturns()
  } catch (err) {
    console.error(err)
  }
}

async function updateStatus(id: string) {
  const status = statusUpdates.value[id]
  if (!status) return
  try {
    const res = await fetch(`/api/order-returns/${id}/status`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update status')
    await res.json()
    fetchReturns()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.returns-table {
  width: 100%;
  border-collapse: collapse;
}

.returns-table th,
.returns-table td {
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
