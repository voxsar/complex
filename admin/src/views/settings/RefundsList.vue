<template>
  <div class="refunds-list">
    <h1>Refunds</h1>
    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="refunds-table">
      <thead>
        <tr>
          <th>Refund ID</th>
          <th>Order</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Reason</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="refund in refunds" :key="refund.id">
          <td>{{ refund.id }}</td>
          <td>
            <router-link v-if="refund.orderId" :to="`/orders/${refund.orderId}`">
              {{ refund.orderId }}
            </router-link>
            <span v-else>—</span>
          </td>
          <td>{{ formatCurrency(refund.amount, refund.currency) }}</td>
          <td>{{ refund.status }}</td>
          <td>{{ refund.reason }}</td>
          <td>{{ new Date(refund.createdAt).toLocaleString() }}</td>
        </tr>
        <tr v-if="refunds.length === 0">
          <td colspan="6">No refunds found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Refund {
  id: string
  paymentIntentId: string
  amount: number
  currency: string
  status: string
  reason?: string
  description?: string
  createdAt: string
  orderId?: string
}

const refunds = ref<Refund[]>([])
const loading = ref(false)
const error = ref('')

const fetchRefunds = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/refunds')
    if (!res.ok) throw new Error('Failed to fetch refunds')
    const data = await res.json()
    const refundItems: Refund[] = data.data || []
    const withOrders = await Promise.all(
      refundItems.map(async refund => {
        let orderId: string | undefined
        try {
          const piRes = await fetch(`/api/payment-intents/${refund.paymentIntentId}`)
          if (piRes.ok) {
            const piData = await piRes.json()
            orderId = piData.orderId
          }
        } catch (e) {
          // ignore errors fetching payment intent
        }
        return { ...refund, orderId }
      })
    )
    refunds.value = withOrders
  } catch (err: any) {
    error.value = err.message || 'Error fetching refunds'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRefunds)

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
</script>

<style scoped>
.refunds-table {
  width: 100%;
  border-collapse: collapse;
}

.refunds-table th,
.refunds-table td {
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
