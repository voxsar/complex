<template>
  <div class="shipping-providers">
    <h1>Shipping Providers</h1>

    <div
      v-for="(provider, index) in providers"
      :key="provider.id || index"
      class="provider"
    >
      <h2>{{ provider.name || `Provider ${index + 1}` }}</h2>

      <label>
        Name
        <input v-model="provider.name" placeholder="Carrier name" />
      </label>

      <label>
        API Key
        <input v-model="provider.apiKey" placeholder="API Key" />
      </label>

      <label>
        API Secret
        <input v-model="provider.apiSecret" placeholder="API Secret" />
      </label>

      <label>
        Services
        <select v-model="provider.services" multiple>
          <option
            v-for="service in availableServices"
            :key="service"
            :value="service"
          >
            {{ service }}
          </option>
        </select>
      </label>

      <button @click="removeProvider(index)">Remove</button>
    </div>

    <div class="actions">
      <button @click="addProvider">Add Provider</button>
      <button @click="saveProviders">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Provider {
  id?: string
  name: string
  apiKey: string
  apiSecret: string
  services: string[]
}

const providers = ref<Provider[]>([])

const availableServices = ['STANDARD', 'EXPRESS', 'OVERNIGHT']

async function loadProviders() {
  try {
    const res = await fetch('/api/shipping-providers')
    if (res.ok) {
      const data = await res.json()
      providers.value = data.providers.map((p: any) => ({
        id: p.id,
        name: p.name,
        apiKey: '',
        apiSecret: '',
        services: (p.supportedServices || []).map((s: any) => s.serviceCode)
      }))
    }
  } catch (err) {
    console.error('Failed to load providers', err)
  }
}

function addProvider() {
  providers.value.push({
    name: '',
    apiKey: '',
    apiSecret: '',
    services: []
  })
}

function removeProvider(index: number) {
  providers.value.splice(index, 1)
}

async function saveProviders() {
  try {
    for (const provider of providers.value) {
      const payload = {
        name: provider.name,
        apiKey: provider.apiKey || undefined,
        apiSecret: provider.apiSecret || undefined,
        supportedServices: provider.services.map(s => ({
          serviceCode: s,
          serviceName: s
        }))
      }

      if (provider.id) {
        await fetch(`/api/shipping-providers/${provider.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        await fetch('/api/shipping-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
    }

    await loadProviders()
  } catch (err) {
    console.error('Failed to save providers', err)
  }
}

loadProviders()
</script>

<style scoped>
.shipping-providers {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px;
}

.provider {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

input,
select {
  padding: 0.25rem;
}
</style>
