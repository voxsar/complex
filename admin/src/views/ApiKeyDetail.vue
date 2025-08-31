<template>
  <div class="api-key-detail">
    <button class="back-btn" @click="goBack">
      <IconArrowLeft :size="18" />
      <span>Back</span>
    </button>

    <div v-if="loading">Loading...</div>
    <div v-else-if="apiKey">
      <div v-if="editing" class="edit-form">
        <label>
          <span>Name</span>
          <input v-model="editData.name" />
        </label>
        <label>
          <span>Description</span>
          <textarea v-model="editData.description" />
        </label>
        <label>
          <span>Permissions</span>
          <input v-model="permissionsInput" placeholder="read,write" />
        </label>
      </div>
      <div v-else class="key-info">
        <h1>{{ apiKey.name }}</h1>
        <p>{{ apiKey.description }}</p>
        <p><strong>Key:</strong> {{ apiKey.key }}</p>
        <p v-if="apiKey.permissions && apiKey.permissions.length">
          <strong>Permissions:</strong> {{ apiKey.permissions.join(', ') }}
        </p>
        <p v-if="apiKey.createdAt"><strong>Created:</strong> {{ apiKey.createdAt }}</p>
        <p v-if="apiKey.expiresAt"><strong>Expires:</strong> {{ apiKey.expiresAt }}</p>
      </div>

      <div class="actions">
        <template v-if="editing">
          <button class="btn primary" @click="save">
            <IconCheck :size="16" />
            <span>Save</span>
          </button>
          <button class="btn secondary" @click="cancel">
            <IconX :size="16" />
            <span>Cancel</span>
          </button>
        </template>
        <template v-else>
          <button class="btn secondary" @click="startEditing">
            <IconEdit :size="16" />
            <span>Edit</span>
          </button>
        </template>
        <button class="btn danger" @click="revoke">
          <IconTrash :size="16" />
          <span>Revoke</span>
        </button>
      </div>
    </div>
    <div v-else>
      <p>API key not found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getApiKey,
  updateApiKey,
  deleteApiKey,
  type ApiKeyPayload
} from '../api/api-keys'
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX
} from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()

const apiKey = ref<any>(null)
const loading = ref(true)
const editing = ref(false)

const editData = ref<ApiKeyPayload>({
  name: '',
  description: '',
  permissions: []
})

const permissionsInput = computed({
  get() {
    return (editData.value.permissions || []).join(', ')
  },
  set(val: string) {
    editData.value.permissions = val
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
  }
})

const fetchApiKey = async () => {
  loading.value = true
  try {
    const { data } = await getApiKey(route.params.id as string)
    apiKey.value = data
    editData.value = {
      name: data.name,
      description: data.description,
      permissions: data.permissions || []
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchApiKey)

const goBack = () => {
  router.push('/settings/api-keys')
}

const startEditing = () => {
  editing.value = true
}

const cancel = () => {
  editing.value = false
  editData.value = {
    name: apiKey.value?.name || '',
    description: apiKey.value?.description || '',
    permissions: apiKey.value?.permissions || []
  }
}

const save = async () => {
  if (!apiKey.value) return
  await updateApiKey(apiKey.value.id, editData.value)
  await fetchApiKey()
  editing.value = false
}

const revoke = async () => {
  if (!apiKey.value) return
  await deleteApiKey(apiKey.value.id)
  router.push('/settings/api-keys')
}
</script>

<style scoped>
.api-key-detail {
  padding: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.edit-form label {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn.danger {
  color: #dc2626;
}
</style>

