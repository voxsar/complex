<template>
  <div class="customers-list">
    <h1>Customers</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="customers-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customers" :key="customer.id">
          <td>{{ customer.firstName }} {{ customer.lastName }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ new Date(customer.createdAt).toLocaleString() }}</td>
          <td>
            <RouterLink :to="`/customers/${customer.id}`">View</RouterLink>
          </td>
        </tr>
        <tr v-if="customers.length === 0">
          <td colspan="4">No customers found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

const customers = ref<Customer[]>([])
const loading = ref(false)
const error = ref('')

const fetchCustomers = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/customers')
    if (!res.ok) throw new Error('Failed to fetch customers')
    const data = await res.json()
    customers.value = data.customers ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching customers'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
.customers-table {
  width: 100%;
  border-collapse: collapse;
}

.customers-table th,
.customers-table td {
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
