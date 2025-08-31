<template>
  <div class="zones-container">
    <h1 class="page-title">Shipping Zones</h1>

    <!-- Create zone form -->
    <form class="create-form" @submit.prevent="createZone">
      <input
        v-model="newZone.name"
        placeholder="Zone name"
        required
      />
      <input
        v-model="newZone.countries"
        placeholder="Countries (comma separated codes)"
      />
      <input
        v-model="newZone.states"
        placeholder="States/Regions (comma separated codes)"
      />
      <button type="submit" class="btn primary">Add Zone</button>
    </form>

    <!-- Zones table -->
    <table class="zones-table" v-if="zones.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Countries/Regions</th>
          <th>Rates</th>
          <th class="action-column"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="zone in zones" :key="zone.id">
          <td>{{ zone.name }}</td>
          <td>
            <div>{{ formatCountries(zone.countries) }}</div>
            <div v-if="zone.states.length">
              States: {{ zone.states.join(', ') }}
            </div>
          </td>
          <td class="rates-cell">
            <ul>
              <li v-for="rate in zone.shippingRates" :key="rate.id" class="rate-item">
                {{ rate.name }}<span v-if="rate.flatRate"> - ${{ rate.flatRate }}</span>
                <button
                  class="small action-btn"
                  title="Remove rate"
                  @click="removeRate(zone, rate)"
                >×</button>
              </li>
            </ul>
            <button class="small btn secondary" @click="addRate(zone)">Add rate</button>
          </td>
          <td class="action-column">
            <button class="small action-btn" @click="editZone(zone)">Edit</button>
            <button class="small action-btn" @click="deleteZone(zone.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="empty">No shipping zones found.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import httpClient from '../../api/httpClient'

interface ShippingRate {
  id: string
  name: string
  flatRate?: number
  type: string
  shippingProviderId?: string
}

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  states: string[]
  shippingRates: ShippingRate[]
}

// state
const zones = ref<ShippingZone[]>([])
const newZone = ref({ name: '', countries: '', states: '' })

// util: format region codes to names
const regionFormatter =
  typeof Intl !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

const formatCountries = (codes: string[]) => {
  if (!codes || codes.length === 0) return '—'
  return codes
    .map((c) => (regionFormatter ? regionFormatter.of(c) || c : c))
    .join(', ')
}

// fetch zones and their rates
const fetchZones = async () => {
  try {
    const data = await httpClient.get<{ zones: ShippingZone[] }>('/shipping-zones')
    const zonesWithRates: ShippingZone[] = await Promise.all(
      data.zones.map(async (z: any) => {
        const rateData = await httpClient.get<{ rates: ShippingRate[] }>('/shipping-rates', {
          params: { shippingZoneId: z.id }
        })
        return { ...z, shippingRates: rateData.rates }
      })
    )
    zones.value = zonesWithRates
  } catch (err) {
    console.error('Failed to load shipping zones', err)
  }
}

onMounted(fetchZones)

// create zone
const createZone = async () => {
  const payload = {
    name: newZone.value.name,
    countries: newZone.value.countries
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    states: newZone.value.states
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    cities: [],
    postalCodes: [],
    isActive: true,
    priority: zones.value.length + 1
  }

  try {
    const created = await httpClient.post<ShippingZone>('/shipping-zones', payload)
    created.shippingRates = []
    zones.value.push(created)
    newZone.value = { name: '', countries: '', states: '' }
  } catch (err) {
    console.error('Failed to create shipping zone', err)
  }
}

// edit zone
const editZone = async (zone: ShippingZone) => {
  const name = prompt('Zone name', zone.name) || zone.name
  const countries =
    prompt('Countries (comma separated codes)', zone.countries.join(', ')) ||
    zone.countries.join(', ')
  const states =
    prompt('States/Regions (comma separated codes)', zone.states.join(', ')) ||
    zone.states.join(', ')

  const payload = {
    ...zone,
    name,
    countries: countries.split(',').map((c) => c.trim()).filter(Boolean),
    states: states.split(',').map((s) => s.trim()).filter(Boolean)
  }

  try {
    const updated = await httpClient.put<ShippingZone>(`/shipping-zones/${zone.id}`, payload)
    const index = zones.value.findIndex((z) => z.id === zone.id)
    zones.value[index] = { ...updated, shippingRates: zone.shippingRates }
  } catch (err) {
    console.error('Failed to update shipping zone', err)
  }
}

// delete zone
const deleteZone = async (id: string) => {
  if (!confirm('Delete this shipping zone?')) return
  try {
    await httpClient.delete(`/shipping-zones/${id}`)
    zones.value = zones.value.filter((z) => z.id !== id)
  } catch (err) {
    console.error('Failed to delete shipping zone', err)
  }
}

// rate management
const addRate = async (zone: ShippingZone) => {
  const name = prompt('Rate name')
  if (!name) return
  const amountStr = prompt('Flat rate amount', '0') || '0'
  const amount = parseFloat(amountStr)

  const payload = {
    name,
    shippingZoneId: zone.id,
    type: 'FLAT_RATE',
    flatRate: isNaN(amount) ? 0 : amount,
    isActive: true
  }

  try {
    const created = await httpClient.post<ShippingRate>('/shipping-rates', payload)
    zone.shippingRates.push(created)
  } catch (err) {
    console.error('Failed to add shipping rate', err)
  }
}

const removeRate = async (zone: ShippingZone, rate: ShippingRate) => {
  if (!confirm('Remove this rate?')) return
  try {
    await httpClient.delete(`/shipping-rates/${rate.id}`)
    zone.shippingRates = zone.shippingRates.filter((r) => r.id !== rate.id)
  } catch (err) {
    console.error('Failed to remove shipping rate', err)
  }
}
</script>

<style scoped>
.zones-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.create-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.create-form input {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: #f3f4f6;
  cursor: pointer;
}

.btn.primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn.secondary {
  background-color: white;
}

.zones-table {
  width: 100%;
  border-collapse: collapse;
}

.zones-table th,
.zones-table td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
  font-size: 0.875rem;
}

.action-column {
  width: 120px;
}

.rates-cell {
  min-width: 200px;
}

.rate-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn.small,
.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.empty {
  color: #6b7280;
}
</style>
