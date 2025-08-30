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
            <select v-model="statusUpdates[ex.id]">
              <option disabled value="">Select</option>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
            <button @click="updateStatus(ex.id)">Update</button>
          </td>
        </tr>
        <tr v-if="exchanges.length === 0">
          <td colspan="4">No exchanges found</td>
        </tr>
      </tbody>
    </table>

    <h2>Create Exchange</h2>
    <div class="create-form">
      <input v-model="newExchange.orderId" placeholder="Order ID" />
      <input v-model="newExchange.customerId" placeholder="Customer ID" />
      <input v-model="newExchange.reason" placeholder="Reason" />
      <textarea v-model="newExchange.returnItems" placeholder='Return items JSON'></textarea>
      <textarea v-model="newExchange.exchangeItems" placeholder='Exchange items JSON'></textarea>
      <input v-model="newExchange.customerNote" placeholder="Customer note" />
      <textarea v-model="newExchange.shippingAddress" placeholder='Shipping address JSON'></textarea>
      <button @click="createExchange">Create</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Exchange {
  id: string
  orderId: string
  customerId: string
  status: string
}

const exchanges = ref<Exchange[]>([])
const loading = ref(false)
const error = ref('')

const statusOptions = ['requested','approved','rejected','in_transit','received','processed','completed','cancelled']
const statusUpdates = ref<Record<string, string>>({})

const newExchange = ref({ orderId:'', customerId:'', reason:'', returnItems:'[]', exchangeItems:'[]', customerNote:'', shippingAddress:'{}' })

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

async function createExchange() {
  try {
    const body = {
      orderId: newExchange.value.orderId,
      customerId: newExchange.value.customerId,
      reason: newExchange.value.reason,
      customerNote: newExchange.value.customerNote,
      returnItems: JSON.parse(newExchange.value.returnItems || '[]'),
      exchangeItems: JSON.parse(newExchange.value.exchangeItems || '[]'),
      shippingAddress: JSON.parse(newExchange.value.shippingAddress || '{}')
    }
    const res = await fetch('/api/order-exchanges', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Failed to create exchange')
    await res.json()
    newExchange.value = { orderId:'', customerId:'', reason:'', returnItems:'[]', exchangeItems:'[]', customerNote:'', shippingAddress:'{}' }
    fetchExchanges()
  } catch (err) {
    console.error(err)
  }
}

async function updateStatus(id: string) {
  const status = statusUpdates.value[id]
  if (!status) return
  try {
    const res = await fetch(`/api/order-exchanges/${id}/status`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update status')
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
