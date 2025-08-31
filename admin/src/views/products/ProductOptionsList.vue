<template>
  <div class="product-options-list">
    <h1>Product Options</h1>
    <button @click="openCreate" class="btn" :disabled="loading || deletingId !== null">Create Option</button>
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
            <button @click="openEdit(option)" :disabled="loading || deletingId !== null">Edit</button>
            <button @click="deleteOption(option.id)" :disabled="loading || deletingId !== null">Delete</button>
          </td>
        </tr>
        <tr v-if="options.length === 0">
          <td colspan="5">No product options found</td>
        </tr>
      </tbody>
    </table>
  </div>

  <ProductOptionCreateModal
    :is-open="showCreate"
    @close="showCreate = false"
    @saved="handleCreated"
  />
  <ProductOptionEditModal
    :is-open="showEdit"
    :option="selectedOption"
    @close="showEdit = false"
    @saved="handleUpdated"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  listProductOptions,
  deleteProductOption,
  type ProductOption
} from '../../api/product-options'
import ProductOptionCreateModal from './components/ProductOptionCreateModal.vue'
import ProductOptionEditModal from './components/ProductOptionEditModal.vue'
import { useToast } from 'primevue/usetoast'

const options = ref<ProductOption[]>([])
const loading = ref(false)
const error = ref('')
const deletingId = ref<string | null>(null)

const toast = useToast()

const showCreate = ref(false)
const showEdit = ref(false)
const selectedOption = ref<ProductOption | null>(null)

const fetchOptions = async () => {
  loading.value = true
  error.value = ''
  console.debug('Fetching product options')
  try {
    options.value = await listProductOptions()
    console.debug('Fetched product options', options.value)
  } catch (err: any) {
    console.debug('Failed to fetch product options', err)
    const message = err.message || 'Error fetching product options'
    error.value = message
    toast.add({ severity: 'error', summary: 'Error', detail: message })
  } finally {
    loading.value = false
  }
}

onMounted(fetchOptions)

const openCreate = () => {
  showCreate.value = true
}

const openEdit = (option: ProductOption) => {
  selectedOption.value = option
  showEdit.value = true
}

const handleCreated = (option: ProductOption) => {
  options.value.push(option)
}

const handleUpdated = (option: ProductOption) => {
  const index = options.value.findIndex(o => o.id === option.id)
  if (index !== -1) options.value[index] = option
}

const deleteOption = async (id: string) => {
  if (!confirm('Delete this option?')) return
  deletingId.value = id
  console.debug('Deleting product option', id)
  try {
    await deleteProductOption(id)
    options.value = options.value.filter(o => o.id !== id)
    console.debug('Deleted product option', id)
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Product option deleted' })
  } catch (err: any) {
    console.debug('Failed to delete product option', err)
    const message = err.message || 'Error deleting product option'
    toast.add({ severity: 'error', summary: 'Error', detail: message })
  } finally {
    deletingId.value = null
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
