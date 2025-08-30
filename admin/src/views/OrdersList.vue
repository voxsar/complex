<template>
  <div class="orders-list">
    <h1>Orders</h1>

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
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.orderNumber }}</td>
          <td>{{ order.billingAddress?.firstName }} {{ order.billingAddress?.lastName }}</td>
          <td>{{ order.status }}</td>
          <td>{{ formatCurrency(order.total, order.currency) }}</td>
          <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
          <td>
            <button @click="viewOrder(order.id)">View</button>
            <button @click="editOrder(order.id)">Edit</button>
            <button @click="deleteOrder(order.id)">Delete</button>
          </td>
        </tr>
        <tr v-if="orders.length === 0">
          <td colspan="6">No orders found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  createdAt: string
  billingAddress?: { firstName?: string; lastName?: string }
}

const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  fetchOrders()
})

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/orders')
    if (!res.ok) throw new Error('Failed to fetch orders')
    const data = await res.json()
    orders.value = data.orders ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching orders'
  } finally {
    loading.value = false
  }
}

const viewOrder = async (id: string) => {
  try {
    const res = await fetch(`/api/orders/${id}`)
    if (!res.ok) throw new Error('Failed to fetch order')
    const data = await res.json()
    console.log('View order', data)
  } catch (err) {
    console.error(err)
  }
}

const editOrder = async (id: string) => {
  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!res.ok) throw new Error('Failed to update order')
    const data = await res.json()
    console.log('Order updated', data)
    fetchOrders()
  } catch (err) {
    console.error(err)
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
</style>

