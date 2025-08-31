<template>
  <div class="payments-container">
    <h1>Paymenconst fetchconst fetchProviders = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getPaymentProviders()
    providers.value = data || []
  } catch (err: any) {
    error.value = err.message || 'Error fetching payment providers'
  } finally {
    loading.value = false
  }
}ync () => {
  loading.value = true
  error.value = ''
  try {
    const data = await getPaymentProviders()
    providers.value = data || []
  } catch (err: any) {
    error.value = err.message || 'Error fetching payment providers'
  } finally {
    loading.value = false
  }
}1>

    <div class="add-provider">
      <input v-model="newProvider.name" placeholder="Name" />
      <select v-model="newProvider.type">
        <option value="stripe">Stripe</option>
        <option value="paypal">PayPal</option>
        <option value="manual">Manual</option>
      </select>
      <button @click="addProvider">Add</button>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else class="providers-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="provider in providers" :key="provider.id">
          <td>{{ provider.name }}</td>
          <td>{{ provider.type }}</td>
          <td>{{ provider.isEnabled ? 'Enabled' : 'Disabled' }}</td>
          <td>
            <button @click="toggleProvider(provider)">
              {{ provider.isEnabled ? 'Disable' : 'Enable' }}
            </button>
          </td>
        </tr>
        <tr v-if="providers.length === 0">
          <td colspan="4">No payment providers found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPaymentProviders, createPaymentProvider, updatePaymentProvider } from '../../api/payments'

interface PaymentProvider {
  id: string
  name: string
  type: string
  isEnabled: boolean
}

const providers = ref<PaymentProvider[]>([])
const loading = ref(false)
const error = ref('')

const newProvider = ref({ name: '', type: 'stripe' })

const fetchProviders = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/payment-providers')
    if (!res.ok) throw new Error('Failed to fetch payment providers')
    const data = await res.json()
    providers.value = data.providers || []
  } catch (err: any) {
    error.value = err.message || 'Error loading providers'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProviders)

const addProvider = async () => {
  if (!newProvider.value.name) return
  try {
    const res = await fetch('/api/payment-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProvider.value.name,
        type: newProvider.value.type
      })
    })
    if (!res.ok) throw new Error('Failed to add provider')
    const data = await res.json()
    providers.value.push(data)
    newProvider.value.name = ''
    newProvider.value.type = 'stripe'
  } catch (err) {
    console.error(err)
  }
}

const toggleProvider = async (provider: PaymentProvider) => {
  try {
    const res = await fetch(`/api/payment-providers/${provider.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: !provider.isEnabled })
    })
    if (!res.ok) throw new Error('Failed to update provider')
    const data = await res.json()
    provider.isEnabled = data.isEnabled
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.payments-container {
  padding: 1rem;
}

.add-provider {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.providers-table {
  width: 100%;
  border-collapse: collapse;
}

.providers-table th,
.providers-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.error {
  color: red;
  margin: 1rem 0;
}
</style>
