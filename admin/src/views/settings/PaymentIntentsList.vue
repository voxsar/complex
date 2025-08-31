<template>
  <div class="payment-intents-list">
    <h1>Payment Intents</h1>

    <div class="search-container">
      <input type="text" v-model="searchTerm" placeholder="Search" />
    </div>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="intents-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Gateway</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="intent in filteredIntents" :key="intent.id">
          <td>{{ intent.id }}</td>
          <td>{{ intent.customerId }}</td>
          <td>{{ formatCurrency(intent.amount, intent.currency) }}</td>
          <td>
            <select v-model="statusUpdates[intent.id]">
              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </td>
          <td>{{ intent.gateway }}</td>
          <td>{{ new Date(intent.createdAt).toLocaleString() }}</td>
          <td>
            <button @click="updateStatus(intent.id)" :disabled="statusUpdates[intent.id] === intent.status">
              Update
            </button>
          </td>
        </tr>
        <tr v-if="filteredIntents.length === 0">
          <td colspan="7">No payment intents found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface PaymentIntent {
  id: string
  customerId: string
  amount: number
  currency: string
  status: string
  gateway?: string
  description?: string
  createdAt: string
}

const paymentIntents = ref<PaymentIntent[]>([])
const loading = ref(false)
const error = ref('')
const searchTerm = ref('')

const statuses = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'requires_capture',
  'canceled',
  'succeeded'
]

const statusUpdates = ref<Record<string, string>>({})

const filteredIntents = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term) return paymentIntents.value
  return paymentIntents.value.filter(pi =>
    pi.id.toLowerCase().includes(term) ||
    (pi.description?.toLowerCase().includes(term) ?? false)
  )
})

const fetchPaymentIntents = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/payment-intents')
    if (!res.ok) throw new Error('Failed to fetch payment intents')
    const data = await res.json()
    paymentIntents.value = data.paymentIntents ?? []
    statusUpdates.value = {}
    paymentIntents.value.forEach(pi => {
      statusUpdates.value[pi.id] = pi.status
    })
  } catch (err: any) {
    error.value = err.message || 'Error fetching payment intents'
  } finally {
    loading.value = false
  }
}

const updateStatus = async (id: string) => {
  const newStatus = statusUpdates.value[id]
  try {
    const res = await fetch(`/api/payment-intents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) throw new Error('Failed to update status')
    const updated = await res.json()
    const intent = paymentIntents.value.find(p => p.id === id)
    if (intent) intent.status = updated.status
  } catch (err) {
    console.error(err)
  }
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)

onMounted(fetchPaymentIntents)
</script>

<style scoped>
.intents-table {
  width: 100%;
  border-collapse: collapse;
}

.intents-table th,
.intents-table td {
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

.search-container {
  margin: 10px 0;
}
</style>
