<template>
  <div class="saved-payment-methods">
    <h1>Saved Payment Methods</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="methods-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Type</th>
          <th>Brand</th>
          <th>Last4</th>
          <th>Default</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="method in methods" :key="method.id">
          <td>{{ method.id }}</td>
          <td>{{ method.customerId }}</td>
          <td>{{ method.type }}</td>
          <td>{{ method.brand || '-' }}</td>
          <td>{{ method.last4 || '-' }}</td>
          <td>{{ method.isDefault ? 'Yes' : 'No' }}</td>
          <td>
            <button @click="setDefault(method.id)" :disabled="method.isDefault">
              Set Default
            </button>
            <button @click="remove(method.id)">Remove</button>
          </td>
        </tr>
        <tr v-if="methods.length === 0">
          <td colspan="7">No saved payment methods found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface SavedPaymentMethod {
  id: string
  customerId: string
  type: string
  isDefault: boolean
  last4?: string
  brand?: string
}

const methods = ref<SavedPaymentMethod[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  fetchMethods()
})

async function fetchMethods() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/admin/payment-methods')
    if (!res.ok) throw new Error('Failed to fetch payment methods')
    const data = await res.json()
    methods.value = data.data || []
  } catch (err: any) {
    error.value = err.message || 'Error fetching payment methods'
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  try {
    const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete payment method')
    await res.json()
    fetchMethods()
  } catch (err) {
    console.error(err)
  }
}

async function setDefault(id: string) {
  try {
    const res = await fetch(`/api/payment-methods/${id}/default`, { method: 'PATCH' })
    if (!res.ok) throw new Error('Failed to set default payment method')
    await res.json()
    fetchMethods()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.methods-table {
  width: 100%;
  border-collapse: collapse;
}

.methods-table th,
.methods-table td {
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
