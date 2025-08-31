<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">Customer Groups</h1>

    <form @submit.prevent="saveGroup" class="mb-4 space-y-2">
      <div>
        <input
          v-model="form.name"
          type="text"
          placeholder="Group name"
          class="border p-2 w-full"
          required
        />
      </div>
      <div>
        <input
          v-model="form.description"
          type="text"
          placeholder="Description"
          class="border p-2 w-full"
        />
      </div>
      <div>
        <input
          v-model.number="form.discountPercentage"
          type="number"
          placeholder="Discount %"
          class="border p-2 w-full"
        />
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

    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2 text-left">Name</th>
          <th class="border p-2 text-left">Discount</th>
          <th class="border p-2 text-left">Active</th>
          <th class="border p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in groups" :key="group.id" class="hover:bg-gray-50">
          <td class="border p-2">{{ group.name }}</td>
          <td class="border p-2">{{ group.discountPercentage }}%</td>
          <td class="border p-2">{{ group.isActive ? 'Yes' : 'No' }}</td>
          <td class="border p-2 space-x-2 text-center">
            <button
              @click="editGroup(group)"
              class="text-blue-600 hover:underline"
            >Edit</button>
            <button
              @click="deleteGroup(group.id)"
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

interface CustomerGroup {
  id: string
  name: string
  description?: string
  discountPercentage: number
  isActive: boolean
}

const groups = ref<CustomerGroup[]>([])
const form = ref<Partial<CustomerGroup>>({
  name: '',
  description: '',
  discountPercentage: 0,
  isActive: true
})

const fetchGroups = async () => {
  const res = await fetch('/api/customer-groups')
  const data = await res.json()
  groups.value = data.customerGroups || []
}

const saveGroup = async () => {
  if (form.value.id) {
    await fetch(`/api/customer-groups/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await fetch('/api/customer-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  }
  resetForm()
  fetchGroups()
}

const editGroup = (group: CustomerGroup) => {
  form.value = { ...group }
}

const deleteGroup = async (id: string) => {
  await fetch(`/api/customer-groups/${id}`, { method: 'DELETE' })
  fetchGroups()
}

const resetForm = () => {
  form.value = { name: '', description: '', discountPercentage: 0, isActive: true }
}

onMounted(fetchGroups)
</script>
