<template>
  <div class="product-options-list">
    <h1>Product Options</h1>
    <button @click="createOption" class="btn">Create Option</button>
    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="options-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Display Name</th>
          <th>Input Type</th>
          <th>Required</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="option in options" :key="option.id">
          <td>{{ option.name }}</td>
          <td>{{ option.displayName || '-' }}</td>
          <td>{{ option.inputType }}</td>
          <td>{{ option.isRequired ? 'Yes' : 'No' }}</td>
          <td>
            <button @click="editOption(option)">Edit</button>
            <button @click="deleteOption(option.id)">Delete</button>
          </td>
        </tr>
        <tr v-if="options.length === 0">
          <td colspan="5">No product options found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ProductOption {
  id: string
  name: string
  displayName?: string
  inputType: string
  isRequired: boolean
  position: number
}

const options = ref<ProductOption[]>([])
const loading = ref(false)
const error = ref('')

const fetchOptions = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/product-options')
    if (!res.ok) throw new Error('Failed to fetch product options')
    const data = await res.json()
    options.value = data.options ?? []
  } catch (err: any) {
    error.value = err.message || 'Error fetching product options'
  } finally {
    loading.value = false
  }
}

onMounted(fetchOptions)

const createOption = async () => {
  const name = prompt('Option name?')
  if (!name) return
  const displayName = prompt('Display name?', name) || name
  try {
    const res = await fetch('/api/product-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, displayName, values: [], productIds: [] })
    })
    if (!res.ok) throw new Error('Failed to create option')
    const data = await res.json()
    options.value.push(data)
  } catch (err) {
    console.error(err)
  }
}

const editOption = async (option: ProductOption) => {
  const name = prompt('Option name?', option.name)
  if (!name) return
  const displayName = prompt('Display name?', option.displayName || '') || undefined
  try {
    const res = await fetch(`/api/product-options/${option.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, displayName })
    })
    if (!res.ok) throw new Error('Failed to update option')
    const data = await res.json()
    const index = options.value.findIndex(o => o.id === option.id)
    if (index !== -1) options.value[index] = data
  } catch (err) {
    console.error(err)
  }
}

const deleteOption = async (id: string) => {
  if (!confirm('Delete this option?')) return
  try {
    const res = await fetch(`/api/product-options/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete option')
    options.value = options.value.filter(o => o.id !== id)
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.options-table {
  width: 100%;
  border-collapse: collapse;
}
.options-table th,
.options-table td {
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
.btn {
  margin-bottom: 10px;
}
</style>
