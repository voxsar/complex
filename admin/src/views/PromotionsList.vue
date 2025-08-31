<template>
  <div class="promotions-container">
    <div class="header-actions">
      <h1 class="page-title">Promotions</h1>
      <button class="btn primary" @click="openCreateModal">
        <IconPlus :size="16" class="mr-1" />
        Create
      </button>
    </div>

    <!-- Promotion Modal -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingPromotion ? 'Edit Promotion' : 'Create Promotion' }}</h2>
          <button class="close-btn" @click="closeModal">
            <IconX :size="20" />
          </button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>Name</label>
            <input v-model="form.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" class="form-textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Rules</label>
            <textarea
              v-model="form.rules"
              class="form-textarea"
              rows="4"
              placeholder="One rule per line"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn secondary" @click="closeModal">Cancel</button>
          <button class="btn primary" @click="savePromotion">Save</button>
        </div>
      </div>
    </div>

    <!-- Promotions Table -->
    <div class="promotions-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Rules</th>
            <th class="action-column"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="promo in promotions" :key="promo.id">
            <td>{{ promo.name }}</td>
            <td>{{ promo.description }}</td>
            <td class="rules-cell">
              <ul>
                <li v-for="rule in promo.rules" :key="rule">{{ rule }}</li>
              </ul>
            </td>
            <td class="action-column">
              <button class="action-btn" @click="openEditModal(promo)">
                <IconEdit :size="16" />
              </button>
              <button class="action-btn danger" @click="deletePromotionHandler(promo.id)">
                <IconTrash :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconPlus, IconEdit, IconTrash, IconX } from '@tabler/icons-vue'
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  type Promotion,
  type PromotionPayload
} from '../api/promotions'

const promotions = ref<Promotion[]>([])

const fetchPromotions = async () => {
  try {
    promotions.value = await getPromotions()
  } catch (error) {
    console.error('Failed to load promotions', error)
  }
}

onMounted(fetchPromotions)

const isModalOpen = ref(false)
const editingPromotion = ref<Promotion | null>(null)
const form = ref({ name: '', description: '', rules: '' })

const resetForm = () => {
  form.value = { name: '', description: '', rules: '' }
}

const openCreateModal = () => {
  editingPromotion.value = null
  resetForm()
  isModalOpen.value = true
}

const openEditModal = (promo: Promotion) => {
  editingPromotion.value = promo
  form.value = {
    name: promo.name,
    description: promo.description,
    rules: promo.rules.join('\n')
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const savePromotion = async () => {
  const payload: PromotionPayload = {
    name: form.value.name,
    description: form.value.description,
    rules: form.value.rules
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)
  }
  try {
    if (editingPromotion.value) {
      const updated = await updatePromotion(editingPromotion.value.id, payload)
      const index = promotions.value.findIndex(p => p.id === editingPromotion.value?.id)
      if (index !== -1) promotions.value[index] = updated
    } else {
      const created = await createPromotion(payload)
      promotions.value.push(created)
    }
    closeModal()
  } catch (error) {
    console.error('Failed to save promotion', error)
  }
}

const deletePromotionHandler = async (id: string) => {
  try {
    await deletePromotion(id)
    promotions.value = promotions.value.filter(p => p.id !== id)
  } catch (error) {
    console.error('Failed to delete promotion', error)
  }
}
</script>

<style scoped>
.promotions-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn.primary {
  background-color: #3b82f6;
  color: #fff;
}

.btn.secondary {
  background-color: #e5e7eb;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 0.5rem;
}

.action-btn.danger {
  color: #dc2626;
}

.promotions-table table {
  width: 100%;
  border-collapse: collapse;
}

.promotions-table th,
.promotions-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.rules-cell ul {
  padding-left: 1rem;
  margin: 0;
}

.action-column {
  width: 100px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-content {
  padding: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-input,
.form-textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
</style>
