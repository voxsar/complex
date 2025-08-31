<template>
  <div class="orders-list">
    <h1>Orders</h1>

    <!-- Filters -->
    <div class="filters">
      <label>
        Status:
        <select v-model="statusFilter" @change="fetchOrders">
          <option value="">All</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label>
        Search:
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Order # or customer"
          @keyup.enter="fetchOrders"
        />
      </label>
      <button @click="fetchOrders">Apply</button>
    </div>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="orders-table">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Status</th>
          <th>Total</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in filteredOrders" :key="order.id">
          <td>{{ order.orderNumber }}</td>
          <td>{{ order.billingAddress?.firstName }} {{ order.billingAddress?.lastName }}</td>
          <td>
            <select v-model="order.status" @change="updateStatus(order.id, order.status)">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </td>
          <td>{{ formatCurrency(order.total, order.currency) }}</td>
          <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
          <td>
            <button @click="viewOrder(order.id)">View</button>
            <button @click="deleteOrder(order.id)">Delete</button>
          </td>
        </tr>
        <tr v-if="filteredOrders.length === 0">
          <td colspan="6">No orders found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  billingAddress?: { firstName?: string; lastName?: string }
}

const router = useRouter()
const orders = ref<OrderSummary[]>([])
const loading = ref(false)
const error = ref('')
const statusFilter = ref('')
const searchQuery = ref('')

const statusOptions = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]

const filteredOrders = computed(() =>
  orders.value.filter(o => {
    const matchesStatus = !statusFilter.value || o.status === statusFilter.value
    const search = searchQuery.value.toLowerCase()
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search) ||
      `${o.billingAddress?.firstName ?? ''} ${o.billingAddress?.lastName ?? ''}`
        .toLowerCase()
        .includes(search)
    return matchesStatus && matchesSearch
  })
)

onMounted(() => {
  fetchOrders()
})

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (statusFilter.value) params.append('status', statusFilter.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    const res = await fetch(`/api/orders?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch orders')
    const data = await res.json()
    orders.value = data.orders ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching orders'
  } finally {
    loading.value = false
  }
}

const viewOrder = (id: string) => {
  router.push(`/orders/${id}`)
}

const updateStatus = async (id: string, status: string) => {
  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error('Failed to update order status')
  } catch (err) {
    console.error(err)
    fetchOrders()
  }
}

const deleteOrder = async (id: string) => {
  if (!confirm('Are you sure you want to delete this order?')) return
  try {
    const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete order')
    orders.value = orders.value.filter(o => o.id !== id)
  } catch (err) {
    console.error(err)
  }
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
</script>

<style scoped>
.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
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

.filters {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filters label {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.filters input,
.filters select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>

