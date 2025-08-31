<template>
  <div class="tax-regions-list">
    <h1>Tax Regions</h1>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <div v-else>
      <form @submit.prevent="createRegion" class="create-form">
        <input v-model="newRegion.name" placeholder="Name" required />
        <input v-model="newRegion.countryCode" placeholder="Country Code" required />
        <input v-model="newRegion.subdivisionCode" placeholder="Subdivision Code" />
        <input
          v-model.number="newRegion.defaultTaxRate"
          type="number"
          step="0.01"
          min="0"
          max="1"
          placeholder="Tax Rate (e.g., 0.08)"
        />
        <input
          v-model="newRegion.defaultTaxRateName"
          placeholder="Tax Rate Name"
        />
        <button type="submit">Add Region</button>
      </form>

      <table class="tax-regions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Subdivision</th>
            <th>Rate</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="region in taxRegions" :key="region.id">
            <td>{{ region.name }}</td>
            <td>{{ region.countryCode }}</td>
            <td>{{ region.subdivisionCode || '-' }}</td>
            <td>{{ formatRate(region.defaultTaxRate) }}</td>
            <td>{{ region.status }}</td>
            <td>
              <button @click="promptUpdate(region)">Edit</button>
              <button @click="calculate(region)">Calc</button>
              <button @click="remove(region.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="taxRegions.length === 0">
            <td colspan="6">No tax regions found</td>
          </tr>
        </tbody>
      </table>

      <div v-if="calcResult" class="calc-result">
        <h3>Tax Calculation</h3>
        <p>
          Region: {{ calcResult.regionName }} - Amount: {{ calcResult.amount }} =>
          Tax: {{ calcResult.taxAmount }} (Rate:
          {{ calcResult.taxRatePercentage.toFixed(2) }}%)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface TaxRegion {
  id: string
  name: string
  countryCode: string
  subdivisionCode?: string
  status: string
  defaultTaxRate?: number
  defaultTaxRateName?: string
}

const taxRegions = ref<TaxRegion[]>([])
const loading = ref(false)
const error = ref('')
const calcResult = ref<any | null>(null)

const newRegion = ref({
  name: '',
  countryCode: '',
  subdivisionCode: '',
  defaultTaxRate: 0,
  defaultTaxRateName: ''
})

const fetchTaxRegions = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/tax-regions')
    if (!res.ok) throw new Error('Failed to fetch tax regions')
    const data = await res.json()
    taxRegions.value = data.taxRegions ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching tax regions'
  } finally {
    loading.value = false
  }
}

const createRegion = async () => {
  try {
    const res = await fetch('/api/tax-regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRegion.value.name,
        countryCode: newRegion.value.countryCode,
        subdivisionCode: newRegion.value.subdivisionCode || undefined,
        defaultTaxRateName: newRegion.value.defaultTaxRateName || undefined,
        defaultTaxRate: newRegion.value.defaultTaxRate || undefined
      })
    })
    if (!res.ok) throw new Error('Failed to create tax region')
    newRegion.value = {
      name: '',
      countryCode: '',
      subdivisionCode: '',
      defaultTaxRate: 0,
      defaultTaxRateName: ''
    }
    await fetchTaxRegions()
  } catch (err: any) {
    error.value = err.message || 'Error creating tax region'
  }
}

const promptUpdate = async (region: TaxRegion) => {
  const rateStr = prompt(
    'Enter new default tax rate (e.g., 0.08)',
    region.defaultTaxRate?.toString() || ''
  )
  if (rateStr === null) return
  const rate = parseFloat(rateStr)
  if (isNaN(rate)) return
  try {
    const res = await fetch(`/api/tax-regions/${region.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultTaxRate: rate })
    })
    if (!res.ok) throw new Error('Failed to update tax region')
    await fetchTaxRegions()
  } catch (err: any) {
    error.value = err.message || 'Error updating tax region'
  }
}

const remove = async (id: string) => {
  if (!confirm('Delete this tax region?')) return
  try {
    const res = await fetch(`/api/tax-regions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete tax region')
    await fetchTaxRegions()
  } catch (err: any) {
    error.value = err.message || 'Error deleting tax region'
  }
}

const calculate = async (region: TaxRegion) => {
  const amountStr = prompt('Amount to calculate tax for', '100')
  if (amountStr === null) return
  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return
  try {
    const res = await fetch(`/api/tax-regions/${region.id}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    if (!res.ok) throw new Error('Failed to calculate tax')
    calcResult.value = await res.json()
  } catch (err: any) {
    error.value = err.message || 'Error calculating tax'
  }
}

const formatRate = (rate?: number) => {
  if (rate === undefined || rate === null) return '-'
  return `${(rate * 100).toFixed(2)}%`
}

onMounted(() => {
  fetchTaxRegions()
})
</script>

<style scoped>
.tax-regions-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.tax-regions-table th,
.tax-regions-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.create-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.create-form input {
  padding: 4px 8px;
}

.state {
  margin: 20px 0;
}

.state.error {
  color: red;
}

.calc-result {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}
</style>
