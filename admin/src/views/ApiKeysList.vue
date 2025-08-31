<template>
  <div class="api-keys-list">
    <h1>API Keys</h1>

    <div class="create-section">
      <input
        v-model="newKeyName"
        type="text"
        placeholder="New API key name"
        class="create-input"
      />
      <button class="btn primary" @click="createKey" :disabled="creating || !newKeyName">
        Create
      </button>
    </div>

    <div v-if="createdKey" class="new-key">
      <p><strong>New API Key:</strong> {{ createdKey }}</p>
      <p class="warning">Store this key securely. You won't see it again.</p>
    </div>

    <div v-if="loading" class="state">Loading...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <table v-else class="keys-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Prefix</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="key in apiKeys" :key="key.id">
          <td>
            <RouterLink :to="`/api-keys/${key.id}`">{{ key.name }}</RouterLink>
          </td>
          <td>{{ key.keyPrefix }}</td>
          <td>{{ key.status }}</td>
          <td>{{ new Date(key.createdAt).toLocaleString() }}</td>
          <td>
            <button
              class="btn link"
              @click="revokeKey(key.id)"
              :disabled="key.status === 'REVOKED'"
            >
              Revoke
            </button>
          </td>
        </tr>
        <tr v-if="apiKeys.length === 0">
          <td colspan="5">No API keys found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getApiKeys, createApiKey } from '../api/api-keys'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  status: string
  createdAt: string
}

const apiKeys = ref<ApiKey[]>([])
const loading = ref(false)
const error = ref('')

const newKeyName = ref('')
const creating = ref(false)
const createdKey = ref('')

const fetchApiKeys = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getApiKeys()
    apiKeys.value = res.apiKeys || []
  } catch (err: any) {
    error.value = err.message || 'Failed to load API keys'
  } finally {
    loading.value = false
  }
}

const createKey = async () => {
  if (!newKeyName.value) return
  creating.value = true
  try {
    const res = await createApiKey({ name: newKeyName.value })
    createdKey.value = res.apiKey.key
    apiKeys.value.unshift({
      id: res.apiKey.id,
      name: res.apiKey.name,
      keyPrefix: res.apiKey.keyPrefix,
      status: res.apiKey.status,
      createdAt: res.apiKey.createdAt,
    })
    newKeyName.value = ''
  } catch (err: any) {
    alert(err.message || 'Failed to create API key')
  } finally {
    creating.value = false
  }
}

const revokeKey = async (id: string) => {
  if (!confirm('Revoke this API key?')) return
  try {
    await fetch(`/api/admin/api-keys/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REVOKED' }),
    })
    const key = apiKeys.value.find(k => k.id === id)
    if (key) key.status = 'REVOKED'
  } catch (err: any) {
    alert(err.message || 'Failed to revoke API key')
  }
}

onMounted(fetchApiKeys)
</script>

<style scoped>
.create-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.create-input {
  padding: 4px 8px;
  flex: 1;
}

.keys-table {
  width: 100%;
  border-collapse: collapse;
}

.keys-table th,
.keys-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.state {
  margin: 1rem 0;
}

.state.error {
  color: red;
}

.new-key {
  margin: 1rem 0;
  padding: 0.5rem;
  background: #f5f5f5;
}

.warning {
  color: #a00;
  font-size: 0.9rem;
}
</style>

