<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">Shipping Rates</h1>

    <!-- Form for creating/updating a rate -->
    <form @submit.prevent="saveRate" class="mb-4 space-y-2">
      <div>
        <input
          v-model="form.name"
          type="text"
          placeholder="Rate name"
          class="border p-2 w-full"
          required
        />
      </div>
      <div>
        <textarea
          v-model="form.description"
          placeholder="Description"
          class="border p-2 w-full"
        />
      </div>
      <div>
        <select v-model="form.shippingZoneId" class="border p-2 w-full" required>
          <option disabled value="">Select shipping zone</option>
          <option v-for="zone in zones" :key="zone.id" :value="zone.id">
            {{ zone.name }}
          </option>
        </select>
      </div>
      <div>
        <select v-model="form.type" class="border p-2 w-full" required>
          <option value="FLAT_RATE">Flat Rate</option>
          <option value="WEIGHT_BASED">Weight Based</option>
          <option value="PRICE_BASED">Price Based</option>
        </select>
      </div>

      <!-- Type specific fields -->
      <div v-if="form.type === 'FLAT_RATE'" class="space-y-2">
        <input
          v-model.number="form.flatRate"
          type="number"
          step="0.01"
          placeholder="Flat rate"
          class="border p-2 w-full"
          required
        />
        <input
          v-model.number="form.freeShippingThreshold"
          type="number"
          step="0.01"
          placeholder="Free shipping threshold"
          class="border p-2 w-full"
        />
      </div>

      <div v-else-if="form.type === 'WEIGHT_BASED'" class="space-y-2">
        <input
          v-model.number="form.weightRate"
          type="number"
          step="0.01"
          placeholder="Rate per weight unit"
          class="border p-2 w-full"
          required
        />
        <div class="flex space-x-2">
          <input
            v-model.number="form.minWeight"
            type="number"
            step="0.01"
            placeholder="Min weight"
            class="border p-2 w-full"
          />
          <input
            v-model.number="form.maxWeight"
            type="number"
            step="0.01"
            placeholder="Max weight"
            class="border p-2 w-full"
          />
        </div>
      </div>

      <div v-else-if="form.type === 'PRICE_BASED'" class="space-y-2">
        <input
          v-model.number="form.priceRate"
          type="number"
          step="0.01"
          placeholder="Rate percentage"
          class="border p-2 w-full"
          required
        />
        <div class="flex space-x-2">
          <input
            v-model.number="form.minPrice"
            type="number"
            step="0.01"
            placeholder="Min price"
            class="border p-2 w-full"
          />
          <input
            v-model.number="form.maxPrice"
            type="number"
            step="0.01"
            placeholder="Max price"
            class="border p-2 w-full"
          />
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <input v-model="form.isActive" type="checkbox" id="isActive" />
        <label for="isActive">Active</label>
      </div>

      <div class="space-x-2">
        <button type="submit" class="bg-blue-500 text-white px-4 py-1 rounded">
          {{ form.id ? 'Update' : 'Create' }}
        </button>
        <button
          v-if="form.id"
          type="button"
          @click="resetForm"
          class="px-4 py-1 border rounded"
        >
          Cancel
        </button>
      </div>
    </form>

    <!-- Rates table -->
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2 text-left">Name</th>
          <th class="border p-2 text-left">Zone</th>
          <th class="border p-2 text-left">Type</th>
          <th class="border p-2 text-left">Rate</th>
          <th class="border p-2 text-left">Active</th>
          <th class="border p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="rate in rates"
          :key="rate.id"
          class="hover:bg-gray-50"
        >
          <td class="border p-2">{{ rate.name }}</td>
          <td class="border p-2">{{ zoneName(rate.shippingZoneId) }}</td>
          <td class="border p-2">{{ rate.type }}</td>
          <td class="border p-2">
            <span v-if="rate.type === 'FLAT_RATE'">${{ rate.flatRate }}</span>
            <span v-else-if="rate.type === 'WEIGHT_BASED'">{{ rate.weightRate }}/unit</span>
            <span v-else-if="rate.type === 'PRICE_BASED'">{{ rate.priceRate }}%</span>
          </td>
          <td class="border p-2">{{ rate.isActive ? 'Yes' : 'No' }}</td>
          <td class="border p-2 space-x-2 text-center">
            <button
              @click="editRate(rate)"
              class="text-blue-600 hover:underline"
            >Edit</button>
            <button
              @click="deleteRate(rate.id)"
              class="text-red-600 hover:underline"
            >Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ShippingRate {
  id: string
  name: string
  description?: string
  shippingZoneId: string
  type: string
  flatRate?: number
  weightRate?: number
  priceRate?: number
  freeShippingThreshold?: number
  minWeight?: number
  maxWeight?: number
  minPrice?: number
  maxPrice?: number
  isActive: boolean
}

interface ShippingZone {
  id: string
  name: string
}

const rates = ref<ShippingRate[]>([])
const zones = ref<ShippingZone[]>([])

const form = ref<Partial<ShippingRate>>({
  name: '',
  description: '',
  shippingZoneId: '',
  type: 'FLAT_RATE',
  flatRate: undefined,
  freeShippingThreshold: undefined,
  weightRate: undefined,
  minWeight: undefined,
  maxWeight: undefined,
  priceRate: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  isActive: true
})

const fetchRates = async () => {
  const res = await fetch('/api/shipping-rates')
  const data = await res.json()
  rates.value = data.rates || []
}

const fetchZones = async () => {
  const res = await fetch('/api/shipping-zones')
  const data = await res.json()
  zones.value = data.zones || []
}

const zoneName = (id: string) => {
  const zone = zones.value.find(z => z.id === id)
  return zone ? zone.name : id
}

const saveRate = async () => {
  const payload = { ...form.value }
  if (form.value.id) {
    await fetch(`/api/shipping-rates/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } else {
    await fetch('/api/shipping-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
  resetForm()
  fetchRates()
}

const editRate = (rate: ShippingRate) => {
  form.value = { ...rate }
}

const deleteRate = async (id: string) => {
  await fetch(`/api/shipping-rates/${id}`, { method: 'DELETE' })
  fetchRates()
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    shippingZoneId: '',
    type: 'FLAT_RATE',
    flatRate: undefined,
    freeShippingThreshold: undefined,
    weightRate: undefined,
    minWeight: undefined,
    maxWeight: undefined,
    priceRate: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    isActive: true
  }
}

onMounted(() => {
  fetchRates()
  fetchZones()
})
</script>

