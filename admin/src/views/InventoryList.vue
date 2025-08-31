<template>
  <div class="inventory-container">
    <h1 class="page-title">Inventory</h1>

    <!-- Bulk adjust section -->
    <div class="bulk-actions">
      <input
        type="number"
        v-model.number="bulkAmount"
        placeholder="Adjust by"
        class="bulk-input"
      />
      <button
        class="btn primary"
        @click="bulkAdjust"
        :disabled="selectedIds.length === 0 || bulkAmount === 0"
      >
        Adjust Selected
      </button>
    </div>

    <!-- Inventory table -->
    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="inventory-table">
      <thead>
        <tr>
          <th class="checkbox-column">
            <input
              type="checkbox"
              @change="toggleAll($event)"
              :checked="selectedIds.length === inventory.length && inventory.length > 0"
            />
          </th>
          <th>Product</th>
          <th>Variant</th>
          <th>Quantity</th>
          <th>Reserved</th>
          <th>Available</th>
          <th>Adjust</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in inventory" :key="item.id">
          <td class="checkbox-column">
            <input type="checkbox" v-model="selectedIds" :value="item.id" />
          </td>
          <td>{{ item.productId }}</td>
          <td>{{ item.variantId || '-' }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.reservedQuantity }}</td>
          <td>{{ item.availableQuantity }}</td>
          <td class="adjust-column">
            <input
              type="number"
              v-model.number="adjustments[item.id]"
              class="adjust-input"
            />
            <button
              class="btn secondary adjust-btn"
              @click="adjustItem(item.id)"
              :disabled="!adjustments[item.id]"
            >
              Apply
            </button>
          </td>
        </tr>
        <tr v-if="inventory.length === 0">
          <td colspan="7">No inventory items found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface InventoryItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
}

const inventory = ref<InventoryItem[]>([])
const loading = ref(false)
const error = ref('')

const selectedIds = ref<string[]>([])
const adjustments = ref<Record<string, number>>({})
const bulkAmount = ref(0)

const fetchInventory = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/inventory')
    if (!res.ok) throw new Error('Failed to fetch inventory')
    const data = await res.json()
    inventory.value = data.inventory || []
  } catch (err: any) {
    error.value = err.message || 'Error loading inventory'
  } finally {
    loading.value = false
  }
}

onMounted(fetchInventory)

const adjustItem = async (id: string) => {
  const amount = adjustments.value[id]
  if (!amount) return
  try {
    const res = await fetch(`/api/inventory/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: amount, reason: 'manual adjustment' })
    })
    if (!res.ok) throw new Error('Failed to adjust inventory')
    const item = inventory.value.find(i => i.id === id)
    if (item) {
      item.quantity += amount
      item.availableQuantity = item.quantity - item.reservedQuantity
    }
    adjustments.value[id] = 0
  } catch (err) {
    console.error(err)
  }
}

const bulkAdjust = async () => {
  if (!bulkAmount.value || selectedIds.value.length === 0) return
  await Promise.all(
    selectedIds.value.map(async id => {
      await fetch(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: bulkAmount.value, reason: 'bulk adjustment' })
      })
      const item = inventory.value.find(i => i.id === id)
      if (item) {
        item.quantity += bulkAmount.value
        item.availableQuantity = item.quantity - item.reservedQuantity
      }
    })
  )
  bulkAmount.value = 0
  selectedIds.value = []
}

const toggleAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? inventory.value.map(i => i.id) : []
}
</script>

<style scoped>
.inventory-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.bulk-input {
  width: 100px;
  padding: 4px 8px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th,
.inventory-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.checkbox-column {
  width: 40px;
  text-align: center;
}

.adjust-column {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.adjust-input {
  width: 80px;
  padding: 4px;
}

.state {
  margin: 1rem 0;
}

.state.error {
  color: red;
}
</style>
